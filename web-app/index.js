'use strict';

const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('express');
const parser = require('body-parser');
const morgan = require('morgan');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);

if (process.env.NODE_ENV != undefined && 
    process.env.NODE_ENV == 'dev') {
  app.use(morgan('dev'));
}

app.use(parser.urlencoded({ 'extended': true}));
app.use(parser.json());
app.use(express.static(path.join(__dirname, 'assets')));

app.get('/', (req, res) => {
  res.status(200).sendfile(path.join(__dirname, 'public', 'index.html'));
});

server.listen(process.env.PORT || 1337, () => {
  console.log(`Application running on port: ${server.address().port}`);
});

