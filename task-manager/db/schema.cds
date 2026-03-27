namespace taskmanager;

using { cuid, managed, sap.common.CodeList } from '@sap/cds/common';

entity Users : cuid {
  name     : String(100) not null;
  email    : String(200) not null;
  role     : String(50) default 'member'; // admin | member
  tasks    : Association to many Tasks on tasks.assignee = $self;
}

entity Projects : cuid, managed {
  name        : String(200) not null;
  description : String(1000);
  status      : String(20) default 'active'; // active | archived | completed
  tasks       : Composition of many Tasks on tasks.project = $self;
}

entity Tasks : cuid, managed {
  title       : String(200) not null;
  description : String(2000);
  status      : String(20) default 'open';   // open | in_progress | done | cancelled
  priority    : String(10) default 'medium'; // low | medium | high | critical
  dueDate     : Date;
  project     : Association to Projects;
  assignee    : Association to Users;
  comments    : Composition of many Comments on comments.task = $self;
}

entity Comments : cuid, managed {
  text : String(2000) not null;
  task : Association to Tasks;
}