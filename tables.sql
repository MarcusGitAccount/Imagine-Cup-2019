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

alter table sessions
add user_id int;

alter table sessions
add constraint sessions_users_fk foreign key(user_id)
  references users(user_id);

update sessions
set user_id = (
  select user_id
  from users
  where name = 'marcuspop'
)
where session_id = 0;

create table devices(
  device_id int identity(0, 1) not null,
  device_name varchar(60)

  constraint devices_pk primary key(device_id)
);

alter table dbo.children
add device_id int;

alter table children
add constraint child_device_fk foreign key(device_id)
  references devices(device_id);

insert into devices
values ('Pi_0000')

update children
set device_id = 0
where child_id = 0;

select datediff(minute, start_time, end_time) as duration
from sessions
where session_id = 9;