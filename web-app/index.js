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
const flash = require('connect-flash');

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server);

const DbModel = require('./db/DatabaseModel');
const db = new DbModel();

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

// APP CONFIGURATION

const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated())
    return next;
  req.flash('auth-error', 'You need to be logged in.');
  return res.status(403).redirect('auth');
}

if (process.env.NODE_ENV != undefined && 
  process.env.NODE_ENV == 'dev') {
  app.use(morgan('dev'));
}

passport.use(new LocalStrategy(
  {passReqToCallback: true},
  (request, username, password, done) => {
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
          !Array.isArray(result.recordset) || result.recordset.length != 1)
          return done(null, false, request.flash('auth-error', 'Username not found.'));
        
        user = result.recordset[0];
        match = await bcrypt.compare(user.password, password);
        return {user, match};
      })
      .then(data => { 
        if (!data)
          return;

        const {user, match} = data;

        if (!match)
          return done(null, false, request.flash('auth-error', 'Invalid credentials.'));
        return done(null, user);
      })
      .catch(error => done(error));
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  db.connect()
    .then(() => {
      return sql.query`
        select *
        from users
        where user_id = ${id}
      `;
    })
    .then(result => {
      if (!result || !Array.isArray(result) || result.length != 1)
        return Promise.reject('Error while deserializing current user.');
      return done(null, result.recordset[0]);
    })
    .catch(error => done(error));
});

app.set('case sensivitive routing', false);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(passport.initialize());
app.use(passport.session());

app.use(parser.urlencoded({ 'extended': true}));
app.use(parser.json());
app.use('assets', express.static(path.join(__dirname, 'assets')));
app.use(cookieParser('kitty'));
app.use(session({
  cookie: {
    maxAge: 60000
  },
  genid: _ => uuid(),
  secret: process.env.SESSION_SECRET || 'Partidul n-a murit.',
  resave: false,
  saveUninitialized: true
}));
app.use(flash());

app.get('/', (req, res) => {
  res.status(200).render('index', {
    title: 'Effing title'
  });
});

app.get('/auth', (req, res) => {
  res.locals.errors = req.flash('auth-error');
  res.status(200).render('auth');
});

app.post('/auth/login', passport.authenticate('local', { 
    successRedirect: '/app',
    failureRedirect: '/auth',
    failureFlash: true 
  })
);

app.post('/auth/signup', (req, res) => {

});

app.post('/auth/logout', (req, res) => {
  req.logout();
  res.redirect('/');

});

app.get('/app', isAuthenticated, (req, res) => {
  res.status(200).render({user: req.session.user.name});
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
