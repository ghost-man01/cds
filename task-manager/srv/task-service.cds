using taskmanager as tm from '../db/schema';

service TaskService @(path: '/api') {

  // Projects
  entity Projects as projection on tm.Projects;

  // Tasks with full navigation
  entity Tasks as projection on tm.Tasks;

  // Users (read-only via service)
  @readonly
  entity Users as projection on tm.Users;

  // Comments
  entity Comments as projection on tm.Comments;

  // Custom Actions
  action assignTask(taskId: UUID, userId: UUID) returns Tasks;
  action completeTask(taskId: UUID)             returns Tasks;
  action reopenTask(taskId: UUID)               returns Tasks;

  // Custom Functions
  function getProjectSummary(projectId: UUID)   returns {
    projectName  : String;
    totalTasks   : Integer;
    openTasks    : Integer;
    inProgress   : Integer;
    doneTasks    : Integer;
    overdueTasks : Integer;
  };

  function getMyTasks(userId: UUID) returns array of Tasks;
}