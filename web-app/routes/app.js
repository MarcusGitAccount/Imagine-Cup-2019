'use strict';

const path = require('path');

module.exports = (app, db, io, isAuthenticated) => {
  app.get('/app', isAuthenticated, (req, res) => {
    res.status(200).render(path.join('app', 'index'), {
      user: req.session.user
    });
  }); 

  app.get('/app/result/:session_id', isAuthenticated, (req, res) => {
    db.connect()
      .then(() => {
        return db.sql.query`
          select *
          from sessions
          where session_id = ${req.params.session_id}
        `
      })
      .then((result => {
        if (result.recordset.length != 1)
          return Promise.reject('Page not found');

        res.status(200).render(path.join('app', 'result'), {
          user: req.session.user,
          session_id: req.params.session_id
        });
      }))
      .catch(error => res.send(error));
  });
};