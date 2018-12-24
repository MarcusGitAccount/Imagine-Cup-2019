'use strict';

const { EventHubClient } = require('@azure/event-hubs');

module.exports = () => {
  if (!process.env.EVENTHUB_CONN_STRING || !process.env.EVENTHUB_NAME)
    throw new Error('Invalid connection data for the event hub.');

  const client = EventHubClient.createFromConnectionString(
    process.env.EVENTHUB_CONN_STRING, 
    process.env.EVENTHUB_NAME);

  return client;
}