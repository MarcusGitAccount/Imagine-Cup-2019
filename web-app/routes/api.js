'use strict';

const deviceControl = require('../iot-hub/ControlDevice')();

module.exports = (app, isAuthenticated, db, io) => {
  app.get('/api/data', isAuthenticated, (req, res) => {
    deviceControl.pingDevice()
      .then(result => res.json({error: null, result}))
      .catch(error => res.json({result: null, error}));
  });
};