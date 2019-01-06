'use strict';

const deviceControl = require('../iot-hub/ControlDevice')();

module.exports = (app, isAuthenticated, db, io) => {
  app.post('/api/pingdevice', isAuthenticated, (req, res) => {
    if (!req.body || !req.body.device)
      return res.json({error: 'Cannot ping device. Invalid POST body.'});

    const device_id = req.body.device.trim();

    deviceControl.pingDevice(device_id, (error, result) => {
      if (error && error.message)
        error = error.message;
      return res.json({error, result});
    });
  });

  app.post('/api/startdevice', isAuthenticated, (req, res) => {
    const device_id = req.body.device.trim();
    const childId = parseInt(req.body.child_id.trim(), 10);
    const sessionName = req.body.session_name;
    const userId = req.session.user.user_id;
    
    db.connect()
    .then(() => {
        return db.sql.query`
          insert into sessions(end_time, session_name, user_id, child_id)
          values(null, ${sessionName}, ${userId}, ${childId})
          select scope_identity();
      `;
      })
      .then(result => {
        const sessionId = result.recordset[0][""];

        deviceControl.startDeviceTelemetry(device_id, childId, sessionId, (error, result) => {
          if (error && error.message)
            return res.json({error: error.message});
          return res.json({result});
        });
      })
      .catch(error =>  {
        res.json({error})
      });
  });

  app.post('/api/stopdevice', isAuthenticated, (req, res) => {
    if (!req.body || !req.body.session_id || !req.body.device)
      return res.json({error: 'No session/device id received in the post request.'});

    const sessionId = req.body.session_id;
    const device = req.body.device.trim();

    db.connect()
      .then(() => {
        return db.sql.query`
          update sessions
          set end_time = getdate()
          where session_id = ${sessionId};
        `;
      })
      .then(result => {
        deviceControl.stopDeviceTelemetry(device, (error, result) => {
          if (error && error.message)
            return res.json({error: error.message});

          db.connect()
            .then(() => {
              return db.sql.query`
                update qs
                set avg_pulse = (
                    select avg(pulse) as avg_pulse
                    from (
                        select top 5 pulse
                        from iot_data
                        where session_id = ${sessionId} and data_time > qs.time
                    ) OrderedTopPulseData
                ) 
                from questions_sessions qs
                where session_id = ${sessionId}
              `;
            })
            .then(result => res.json({result: 'Device stopped and average telemetry updated.'}))
            .catch(error => res.json({error}));   
        });
      })
      .catch(error => res.json({error}));
  });
    
  app.get('/api/children', isAuthenticated, (req, res) => {
    db.connect()
    .then(() => {
      return db.sql.query`
        select 
          child_id,
          concat(first_name, ' ', last_name) as name,
          device_name as device
        from
        children c
        join
        devices d
          on (c.device_id = d.device_id);
      `;
    })
    .then(result => res.json({data: result.recordset}))
    .catch(error => res.json({error}))
  });

  app.get('/api/questions', isAuthenticated, (req, res) => {
    db.connect()
    .then(() => db.sql.query`select * from questions`)
    .then(result => res.json({data: result.recordset}))
    .catch(error => res.json({error}))
  });

  app.post('/api/questions', isAuthenticated, (req, res) => {
    if (!req.body || !req.body.question_body)
      return res.json({error: 'No question body received in the post request.'});

    const question_body = req.body.question_body.trim();
    const user_id = req.session.user.user_id;

    db.connect()
    .then(() => {
      return db.sql.query`
        insert into questions(question_body, 	owner_user_id)
        values(${question_body}, ${user_id})
        select scope_identity();
      `;
    })
    .then(result => res.json({question_id: result.recordset[0][""], question_body}))
    .catch(error => res.json({error}))
  });

  app.post('/api/session_question', isAuthenticated, (req, res) => {
    if (!req.body || !req.body.question_id || !req.body.session_id)
      return res.json({error: 'No question or session id received in the post request.'});

    const question_id = req.body.question_id
    const session_id = req.body.session_id;

    db.connect()
    .then(() => {
      return db.sql.query`
        insert into questions_sessions(question_id, session_id, time)
        values(${question_id}, ${session_id}, getdate())
      `;
    })
    .then(result => res.json({result: 'Pair inserted.'}))
    .catch(error => res.json({error}));
  });

  app.post('/api/note', isAuthenticated, (req, res) => {
    if (!req.body || !req.body.session_id || !req.body.note_body)
      return res.json({error: 'No session id/body note provided.'});

    const session_id = req.body.session_id;
    const note_body = req.body.note_body;
    const userd_id = req.session.user.user_id;

    if (note_body.length == 0)
      return res.json({error: 'Note body cannot be empty.'});

    db.connect()
    .then(() => {
      return db.sql.query`
        insert into notes(note_body, note_time, session_id, user_id)
        values(${note_body}, getdate(), ${session_id}, ${userd_id});
      `;
    })
    .then(result => res.json({result: 'Note inserted.'}))
    .catch(error => res.json({error}));
  });

  app.get('/api/testinsertion', isAuthenticated, (req, res) => {
    let name = '';
    let letters = [];
    const count = (Math.random() * 100) >> 0;

    for (let i = 0; i < 3 + ((Math.random() * 10) >> 0); i++) {
      const char = 65 + ((Math.random() * 25) >> 0);

      letters.push(String.fromCharCode(char));
    }

    name = letters.join('');
    db.connect()
      .then(() => {
        return db.sql.query`
          insert into dummy(name, type_count)
          values(${name}, ${count})
          select scope_identity();
        `;
      })
      .then(result => {
        res.send(result.recordset[0][""] + ' ' + name + ' ' + count);
      })
      .catch(error => {
        res.send(error);
      });
  });


  app.post('/api/result/session', isAuthenticated, (req, res) => {
    if (!req.body || !req.body.session_id)
      return res.json({error: 'No session id provided.'});

    const session_id = req.body.session_id;

    db.connect()
    .then(() => {
      return db.sql.query`
      select 
        s.start_time, s.end_time, s.session_name,
        concat(c.first_name, ' ', c.last_name) as child_name,
        u.name as createdby
      from sessions s
      join children c
        on c.child_id = s.child_id
      join users u
        on u.user_id = s.user_id
      where session_id = ${session_id}
      `;
    })
    .then(result => res.json({data: result.recordset[0]}))
    .catch(error => res.json({error}));
  });

  app.post('/api/result/notes', isAuthenticated, (req, res) => {
    if (!req.body || !req.body.session_id)
      return res.json({error: 'No session id provided.'});

    const session_id = req.body.session_id;

    db.connect()
    .then(() => {
      return db.sql.query`
        select 
          n.note_body, n.note_time, 
          datediff(ms, s.start_time, n.note_time) as elapsed_time
        from notes n
        join sessions s
          on s.session_id = n.session_id
        where n.session_id = ${session_id}
      `;
    })
    .then(result => res.json({data: result.recordset}))
    .catch(error => res.json({error}));
  });

  app.post('/api/result/data', isAuthenticated, (req, res) => {
    if (!req.body || !req.body.session_id || req.body.child_id == undefined)
      return res.json({error: 'No session or child id provided.'});

    const session_id = req.body.session_id;
    const child_id   = req.body.child_id;

    db.connect()
    .then(() => {
      return db.sql.query`
        select pulse, data_time
        from iot_data
        where session_id = ${session_id} and child_id = ${child_id}
      `;
    })
    .then(result => res.json({data: result.recordset}))
    .catch(error => res.json({error}));
  });

  app.post('/api/result/questions', isAuthenticated, (req, res) => {
    if (!req.body || !req.body.session_id)
      return res.json({error: 'No session or child id provided.'});

    const session_id = req.body.session_id;

    db.connect()
    .then(() => {
      return db.sql.query`
        select 
          q.question_body, u.name as createdby,
          qs.avg_pulse, q.question_id, session_name,
          qs.dominant_emotion, qs.dominant_emotion_value
        from questions q
        join users u
          on u.user_id = q.owner_user_id 
        join questions_sessions qs
          on qs.question_id = q.question_id
        join sessions s
          on qs.session_id = s.session_id 
        where qs.session_id = ${session_id};
      `;
    })
    .then(result => res.json({data: result.recordset}))
    .catch(error => res.json({error}));
  });

  app.post('/api/result/other_questions', isAuthenticated, (req, res) => {
    if (!req.body || !req.body.session_id || !req.body.question_id)
      return res.json({error: 'No session or question id provided.'});

    const session_id  = req.body.session_id;
    const question_id = req.body.question_id;

    db.connect()
    .then(() => {
      return db.sql.query`
        select 
          q.question_body, u.name as createdby, 
          qs.avg_pulse, q.question_id, session_name,
          qs.dominant_emotion, qs.dominant_emotion_value
        from questions q
        join users u
          on u.user_id = q.owner_user_id 
        join questions_sessions qs
          on qs.question_id = q.question_id
        join sessions s
          on qs.session_id = s.session_id 
        where qs.session_id != ${session_id} and q.question_id = ${question_id};
      `;
    })
    .then(result => res.json({data: result.recordset}))
    .catch(error => res.json({error}));
  });
};