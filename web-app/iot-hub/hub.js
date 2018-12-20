'use strict';

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
    client.receive(id, onMessage, onError, { eventPosition: EventPosition.fromEnqueuedTime(Date.now()) });
  } 
})
.catch((err) => {
  console.log(err);
});