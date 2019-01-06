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


-- select all questions

select q.question_body, u.name as createdby, qs.avg_pulse, us.name, question_id as askedby
from questions q
join users u
on u.user_id = q.owner_user_id 
join users us
on us.user_id = q.owner_user_id 
join questions_sessions qs
on qs.question_id = q.question_id
where qs.session_id = 15;

-- select previous session questions for comparison

select q.question_id, qs.avg_pulse, s.session_name, u.name as askedby
from questions_sessions qs
join questions q
on q.question_id = qs.question_id
join sessions s
on s.session_id = qs.session_id
join users u
on u.user_id = q.owner_user_id 
where qs.session_id != 15 and q.question_id = 14 and s.child_id = 0

--

alter table sessions
add child_id int;

alter table sessions
add constraint session_child_fk foreign key(child_id)
references children(child_id);

update s
set child_id = (
    select top 1 child_id
    from iot_data
    where session_id = s.session_id
)
from sessions s;

alter table questions_sessions
add dominant_emotion varchar(30);

alter table questions_sessions
add dominant_emotion_value decimal;

create table emotions (
  emotion_id int identity(0, 1) not null,
  child_id int not null,
  session_id int not null,
  emotion_time datetime default getdate(), 
  anger float, 
  contempt float, 
  disgust float, 
  fear float, 
  happiness float, 
  neutral float, 
  sadness float, 
  surprise float,
  
  constraint emotions_pk primary key(emotion_id),
  constraint child_emotions_fk foreign key(child_id)
    references children(child_id) on delete cascade,
  constraint session_emotions_fk foreign key(session_id)
    references sessions(session_id) on delete cascade
);


-- SESSION UPDATE, big query incoming

update qs
set 
  avg_pulse = (
    select avg(pulse) as avg_pulse
    from (
        select top 5 pulse
        from iot_data
        where session_id = 13 and data_time > qs.time
    ) OrderedTopPulseData
  ),
  dominant_emotion = (
    select 
    case
        when anger >= contempt and anger >= disgust and anger >= fear and anger >= happiness and anger >= neutral and anger >= sadness and anger >= surprise then 'anger'
        when contempt >= anger and contempt >= disgust and contempt >= fear and contempt >= happiness and contempt >= neutral and contempt >= sadness and contempt >= surprise then 'contempt'
        when disgust >= anger and disgust >= contempt and disgust >= fear and disgust >= happiness and disgust >= neutral and disgust >= sadness and disgust >= surprise then 'disgust'
        when fear >= anger and fear >= contempt and fear >= disgust and fear >= happiness and fear >= neutral and fear >= sadness and fear >= surprise then 'fear'
        when happiness >= anger and happiness >= contempt and happiness >= disgust and happiness >= fear and happiness >= neutral and happiness >= sadness and happiness >= surprise then 'happiness'
        when neutral >= anger and neutral >= contempt and neutral >= disgust and neutral >= fear and neutral >= happiness and neutral >= sadness and neutral >= surprise then 'neutral'
        when sadness >= anger and sadness >= contempt and sadness >= disgust and sadness >= fear and sadness >= happiness and sadness >= neutral and sadness >= surprise then 'sadness'
        when surprise >= anger and surprise >= contempt and surprise >= disgust and surprise >= fear and surprise >= happiness and surprise >= neutral and surprise >= sadness then 'surprise'
      else 'anger'
    end as dominant_emotion
    from (
      select
        avg(anger)     as  anger, 
        avg(contempt)  as  contempt, 
        avg(disgust)   as  disgust, 
        avg(fear)      as  fear, 
        avg(happiness) as  happiness, 
        avg(neutral)   as  neutral, 
        avg(sadness)   as  sadness, 
        avg(surprise)  as  surprise
      from (
        select top 5 *
        from emotions
        where session_id = 33 and emotion_time > qs.time
      ) Top5ColName
    ) AvgColName
  ),
  dominant_emotion_value = (
    select 
    case
        when anger >= contempt and anger >= disgust and anger >= fear and anger >= happiness and anger >= neutral and anger >= sadness and anger >= surprise then anger
        when contempt >= anger and contempt >= disgust and contempt >= fear and contempt >= happiness and contempt >= neutral and contempt >= sadness and contempt >= surprise then contempt
        when disgust >= anger and disgust >= contempt and disgust >= fear and disgust >= happiness and disgust >= neutral and disgust >= sadness and disgust >= surprise then disgust
        when fear >= anger and fear >= contempt and fear >= disgust and fear >= happiness and fear >= neutral and fear >= sadness and fear >= surprise then fear
        when happiness >= anger and happiness >= contempt and happiness >= disgust and happiness >= fear and happiness >= neutral and happiness >= sadness and happiness >= surprise then happiness
        when neutral >= anger and neutral >= contempt and neutral >= disgust and neutral >= fear and neutral >= happiness and neutral >= sadness and neutral >= surprise then neutral
        when sadness >= anger and sadness >= contempt and sadness >= disgust and sadness >= fear and sadness >= happiness and sadness >= neutral and sadness >= surprise then sadness
        when surprise >= anger and surprise >= contempt and surprise >= disgust and surprise >= fear and surprise >= happiness and surprise >= neutral and surprise >= sadness then surprise
      else anger
    end as dominant_emotion
    from (
      select
        avg(anger)     as  anger, 
        avg(contempt)  as  contempt, 
        avg(disgust)   as  disgust, 
        avg(fear)      as  fear, 
        avg(happiness) as  happiness, 
        avg(neutral)   as  neutral, 
        avg(sadness)   as  sadness, 
        avg(surprise)  as  surprise
      from (
        select top 5 *
        from emotions
        where session_id = 33 and emotion_time > qs.time
      ) Top5ColValue
    ) AvgColValue
  )
from questions_sessions qs
where session_id = 33;


select count(*)
from (
    select session_id, dominant_emotion, dominant_emotion_value
    from emotions
    unpivot (
        dominant_emotion_value
        for dominant_emotion in (anger, contempt, disgust, fear, happiness, neutral ,sadness, surprise)
    ) A
) B


insert into emotions
values (0, 13, getdate(), 0.95, 0, 0.03, 0, 0, 0, 0.03, 0);

insert into emotions
values (0, 13, getdate(), 0, 0, 0.2, 0.2, 0.6, 0, 0, 0)

insert into emotions
values (0, 13, getdate(), 0, 0, 0.45, 0.55, 0, 0, 0.03, 0);

select emotion_id, max(dominant_emotion_value) as dominant_emotion_value
from emotions
unpivot (
    dominant_emotion_value
    for dominant_emotion in (anger, contempt, disgust, fear, happiness, neutral ,sadness, surprise)
) UnPivoted
group by emotion_id