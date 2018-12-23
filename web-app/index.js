'use strict';

const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('express');
const parser = require('body-parser');
const morgan = require('morgan');
const expressLayouts = require('ejs');
const session = require('express-session');
const uuid = require('uuid');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const flash = require('express-flash-messages');

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server);

const DbModel = require('./db/DatabaseModel');
const db = new DbModel();

const constants = require('./constants');

// APP CONFIGURATION
app.set('case sensivitive routing', false);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(parser.urlencoded({ 'extended': true}));
app.use(parser.json());
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use(cookieParser());
app.use(flash());
app.use(session({
  secret: process.env.SESSION_SECRET || 'kitty',
  resave: false,
  saveUninitialized: true,
}))

const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    res.locals.user = req.user;
    return next();
  }
  req.flash('error', 'You need to be logged in.');
  return res.status(403).redirect('auth');
}

if (process.env.NODE_ENV != undefined && 
  process.env.NODE_ENV == 'dev') {
  app.use(morgan('dev'));
}

require('./routes/auth')(app, db, bcrypt);
require('./iot-hub/IOTHubDataStream')(io);

app.get('/app', isAuthenticated, (req, res) => {
  res.status(200).render('app', {user: req.session.user});
});

app.get('/chart', (req, res) => {
  res.status(200).sendfile(path.join(__dirname, 'assets', 'charts.html'));
});

app.get('*', (req, res) => {
  res.status(404).render('404');
});

server.listen(process.env.PORT || 1337, () => {
  console.log(`Application running on port: ${server.address().port}`);
});
