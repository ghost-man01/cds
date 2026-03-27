const cds = require('@sap/cds');

module.exports = cds.service.impl(async function () {
  const { Projects, Tasks, Users, Comments } = this.entities;



  // Validate task before create
  this.before('CREATE', Tasks, async (req) => {
    const { title, priority, dueDate } = req.data;

    if (!title || title.trim() === '') {
      return req.error(400, 'Task title is required.');
    }

    const validPriorities = ['low', 'medium', 'high', 'critical'];
    if (priority && !validPriorities.includes(priority)) {
      return req.error(400, `Priority must be one of: ${validPriorities.join(', ')}`);
    }

    if (dueDate && new Date(dueDate) < new Date()) {
      req.warn(400, 'Due date is in the past.');
    }
  });

  
  this.before('UPDATE', Tasks, async (req) => {
    const task = await SELECT.one.from(Tasks).where({ ID: req.data.ID });
    if (task?.status === 'done') {
      return req.error(409, 'Completed tasks cannot be edited. Reopen the task first.');
    }
  });


  // Auto-complete project if all tasks are done
  this.after('UPDATE', Tasks, async (result) => {
    if (result?.status === 'done' && result?.project_ID) {
      const openTasks = await SELECT.from(Tasks).where({
        project_ID: result.project_ID,
        status: { '!=': 'done' }
      });
      if (openTasks.length === 0) {
        await UPDATE(Projects)
          .set({ status: 'completed' })
          .where({ ID: result.project_ID });
      }
    }
  });



  // Assign a task to a user
  this.on('assignTask', async (req) => {
    const { taskId, userId } = req.data;

    const [task, user] = await Promise.all([
      SELECT.one.from(Tasks).where({ ID: taskId }),
      SELECT.one.from(Users).where({ ID: userId })
    ]);

    if (!task) return req.error(404, `Task ${taskId} not found.`);
    if (!user) return req.error(404, `User ${userId} not found.`);

    await UPDATE(Tasks)
      .set({ assignee_ID: userId, status: 'in_progress' })
      .where({ ID: taskId });

    return SELECT.one.from(Tasks).where({ ID: taskId });
  });

  // Mark task as done
  this.on('completeTask', async (req) => {
    const { taskId } = req.data;
    const task = await SELECT.one.from(Tasks).where({ ID: taskId });

    if (!task) return req.error(404, `Task ${taskId} not found.`);
    if (task.status === 'done') return req.error(409, 'Task is already completed.');

    await UPDATE(Tasks).set({ status: 'done' }).where({ ID: taskId });
    return SELECT.one.from(Tasks).where({ ID: taskId });
  });

  // Reopen a completed task
  this.on('reopenTask', async (req) => {
    const { taskId } = req.data;
    const task = await SELECT.one.from(Tasks).where({ ID: taskId });

    if (!task) return req.error(404, `Task ${taskId} not found.`);

    await UPDATE(Tasks).set({ status: 'open' }).where({ ID: taskId });

    // If project was auto-completed, reactivate it
    if (task.project_ID) {
      await UPDATE(Projects)
        .set({ status: 'active' })
        .where({ ID: task.project_ID, status: 'completed' });
    }

    return SELECT.one.from(Tasks).where({ ID: taskId });
  });

  

  // Project summary stats
  this.on('getProjectSummary', async (req) => {
    const { projectId } = req.data;

    const project = await SELECT.one.from(Projects).where({ ID: projectId });
    if (!project) return req.error(404, `Project ${projectId} not found.`);

    const tasks = await SELECT.from(Tasks).where({ project_ID: projectId });
    const today = new Date().toISOString().split('T')[0];

    return {
      projectName  : project.name,
      totalTasks   : tasks.length,
      openTasks    : tasks.filter(t => t.status === 'open').length,
      inProgress   : tasks.filter(t => t.status === 'in_progress').length,
      doneTasks    : tasks.filter(t => t.status === 'done').length,
      overdueTasks : tasks.filter(t => t.dueDate && t.dueDate < today && t.status !== 'done').length
    };
  });

  // Get tasks for a specific user
  this.on('getMyTasks', async (req) => {
    const { userId } = req.data;
    return SELECT.from(Tasks).where({ assignee_ID: userId });
  });
});