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
const io = require('socket.io')(server);

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

const { EventHubClient, EventPosition } = require('@azure/event-hubs');

const client = EventHubClient.createFromConnectionString(process.env.EVENTHUB_CONN_STRING, process.env.EVENTHUB_NAME);

(async function() {
  return await client.getPartitionIds(); 
})()
.then(partitions => {
  const onError = (err) => {
    console.log("An error occurred on the receiver ", err);
  };
  
  const onMessage = (eventData) => {
    console.log(eventData.body);
    io.emit('datastream', eventData.body);
    const enqueuedTime = eventData.annotations["x-opt-enqueued-time"];
    console.log("Enqueued Time: ", enqueuedTime);
  };


  for (const id of partitions) {
    const receiveHandler = client.receive(id, onMessage, onError, { eventPosition: EventPosition.fromEnqueuedTime(Date.now()) });
  } 
})
.catch((err) => {
  console.log(err);
});