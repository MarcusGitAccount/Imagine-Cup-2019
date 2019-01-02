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

create table questions (
  question_id int identity(0, 1) not null,
  question_body varchar(200) not null,
  owner_user_id int,

  constraint questions_pk primary key(question_id),
  constraint question_owner_fk foreign key(owner_user_id)
    references users(user_id)
);

create table questions_sessions (
  question_id int not null,
  session_id int not null,
  time datetime default getdate(),

  constraint q_fk foreign key(question_id)
    references questions(question_id),
  constraint s_fk foreign key(session_id)
    references sessions(session_id),
  constraint pair_uq unique(question_id, session_id)
);

alter table questions_sessions
add avg_pulse int;

create table notes (
  note_body varchar(200) not null,
  note_time datetime default getdate(),
  session_id int not null,
  constraint notes_sessions_fk foreign key(session_id)
    references sessions(session_id)
);

select 
top 2
*
from sessions
order by session_id desc;

update qs
set avg_pulse = (
    select avg(pulse) as avg_pulse
    from (
        select top 5 pulse
        from iot_data
        where session_id = 15 and data_time > qs.time
    ) OrderedTopPulseData
) 
from questions_sessions qs
where session_id = 15;

alter table notes
add user_id int;

alter table notes
add constraint notes_user_fk foreign key(user_id)
  references users(user_id);