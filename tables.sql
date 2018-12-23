-- Upper db schema

create table users(
  user_id int identity(0, 1) not null, -- autoincrement
  name varchar(60) unique not null,
  password varchar(60) not null
  constraint users_pk primary key(user_id) 
);

create table iot_data(
  pulse smallint not null,
  data_time datetime default getdate(),
  comment varchar(60),

  child_id int not null,
  session_id int not null,

  constraint data_children_fk foreign key(child_id)
    references children(child_id) on delete cascade,
  constraint data_sessions_fk foreign key(session_id)
    references sessions(session_id) on delete cascade
);

create table children(
  child_id int identity(0, 1) not null,
  first_name varchar(30),
  last_name varchar(30),
  birthdate datetime,
  constraint children_pk primary key(child_id)
);

create table sessions(
  session_id int identity(0, 1) not null,
  start_time datetime default getdate(),
  end_time datetime,
  constraint sessions_pk primary key(session_id)
);