'use strict';

const { EventHubClient } = require('@azure/event-hubs');

const client = EventHubClient.createFromConnectionString(process.env.EVENTHUB_CONN_STRING, process.env.EVENTHUB_NAME);

async function main() {
  return await client.getPartitionIds();
}

module.exports = main;