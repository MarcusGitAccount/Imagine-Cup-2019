'use strict';

const constants = require('../constants');

module.exports = (app, db, bcrypt) => {
  app.use((req, res, next) => {
    if (!req.session || !req.session.user)
      return next();

    db.connect()
    .then(() => {
      return db.sql.query`
        select *
        from users
        where user_id = ${req.session.user.user_id};
      `;
    })
    .then(result => {
      if (!result || !result.recordset || 
        !Array.isArray(result.recordset) || result.recordset.length != 1) {
          return next();
        }
        const user = result.recordset[0];
        delete user.password;
        req.session.user = user;
        return next();
      })
    .catch(error => {
      req.flash('error', 'Failed to serialize the current user.');
    });
  });

  app.get('/auth', (req, res) => {
    if (req.session && req.session.user)
      return res.redirect('/app');
    res.status(200).render('auth');
  });
  
  app.post('/auth/login' ,(req, res) => {
    let username = req.body.username;
    let password = req.body.password;

    if (!username || !password) {
      req.flash('error', 'Invalid credentials.');
      res.redirect('/auth');
      return;
    }
    
    username = username.trim();
    password = password.trim();
      
    db.connect()
      .then(() => {
        return db.sql.query`
          select * 
          from users 
          where name = ${username}`;
      })
      .then(async (result) => {
        let user = null;
        
        if (!result || !result.recordset || 
          !Array.isArray(result.recordset) || result.recordset.length != 1) {
            
            req.flash('error', 'Username not found.');
            res.redirect('/auth');
            return Promise.reject('Lorem error.')
        }
          
        user = result.recordset[0];
        return {user: user, match: await bcrypt.compare(password, user.password)};
      })
      .then(data => { 
        const {user, match} = data;

        if (!match) {
          req.flash('error', 'Invalid credentials.');
          res.redirect('/auth');
          return;
        }

        req.session.user = user;
        res.redirect('/app');
      })
      .catch(_ => {
        req.flash('error', 'Error occured during authentication.');
        res.redirect('/auth');
      });
  });

  app.post('/auth/register', (req, res) => {
    const username = req.body.username.trim();
    const password = req.body.password.trim();
    const password_repeat = req.body.password_repeat.trim();

    if (password != password_repeat) {
      req.flash('error', 'Registration: passwords do not match.');
      return res.redirect('/auth');
    }

    db.connect()
      .then(() => {
        return db.sql.query`
          select *
          from users
          where name = ${username}
        `;
      })
      .then(result => {
        if (!(!result || !result.recordset || !Array.isArray(result.recordset))) {
          if (result.recordset.length > 0) {
            req.flash('error', 'Registration: Username alredy taken.');
            return Promise.reject('Lorem');
          }
        }
        return true;
      })
      .then(async (_) => {
        return await bcrypt.hash(password, constants.saltRounds);
      })
      .then(hash => {
        return db.sql.query`
          insert into users(name, password)
          values(${username}, ${hash})`;
      })
      .then(result => {
        if (!result || result.rowsAffected.length != 1)
          return Promise.reject('Lorem error');
        req.session.user = {name: username, password};
        res.redirect('/app');
      })
      .catch(_ => {
        req.flash('error', 'Error occured during registration.');
        res.redirect('/auth');
      });
  });

  app.get('/auth/logout', (req, res) => {
    req.session.destroy(error => {
      if (error)
        return console.log(error); // uhm, not a good practice, right?
    });
    res.redirect('/');
  });
};