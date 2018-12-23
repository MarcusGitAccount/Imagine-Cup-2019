'use strict';

if (!process.env.EVENTHUB_CONN_STRING || !process.env.EVENTHUB_NAME)
  throw new Error('Invalid connection data for the event hub.');

const { EventHubClient, EventPosition } = require('@azure/event-hubs');
const client = EventHubClient.createFromConnectionString(
  process.env.EVENTHUB_CONN_STRING, 
  process.env.EVENTHUB_NAME);


async function getPartitions() {
  return await client.getPartitionIds(); 
}

module.exports = (io) => {
  getPartitions()
    .then(partitions => {
      const onError = (err) => {
        console.log("An error occurred on the receiver ", err);
      };
      
      const onMessage = (eventData) => {
        const enqueuedTime = eventData.annotations["x-opt-enqueued-time"];
        const data = JSON.parse(eventData.body.toString('utf-8'));

        console.log('Receiving data');
        console.log("Enqueued Time: ", enqueuedTime);
        console.log(data, eventData.body)
        console.log();

        io.emit('datastream', eventData.body);
      };
    
      for (const id of partitions) {
        client.receive(id, onMessage, onError, { 
          eventPosition: EventPosition.fromEnqueuedTime(Date.now()) 
        });
      } 
    })
    .catch(error => 
      console.log(error)
    );
};