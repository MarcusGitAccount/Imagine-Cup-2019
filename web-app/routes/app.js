'use strict';

const path = require('path');

module.exports = (app, db, io, isAuthenticated) => {
  app.get('/app', isAuthenticated, (req, res) => {
    res.status(200).render(path.join('app', 'index'), {
      user: req.session.user
    });
  });  
};