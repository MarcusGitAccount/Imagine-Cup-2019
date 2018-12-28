'use strict';

let instance = null;
const Client = require('azure-iothub').Client;

class Controls {
  constructor() {
    if (!process.env.IOTHUB_CONN_STRING)
      throw new Error('No existing connection string for the Iot HUB.');
    
    try {
      this.client = Client.fromConnectionString(process.env.IOTHUB_CONN_STRING);
    }
    catch (error) {
      this.client = null;
    }
  }

  pingDevice(device_id, cb) {
    if (!this.client)
      return cb('Error while creating iot hub client to communicate with the device', null);

    const params = {
      methodName: 'pingDevice',
      responseTimeoutInSeconds: 30,
      payload: 'ping'
    };

    this.client.invokeDeviceMethod(device_id, params, cb);
  }

  startDeviceTelemetry(device_id, child_id, session_id, cb) {
    if (!this.client)
      return cb('Error while creating iot hub client to communicate with the device', null);

    const params = {
      methodName: 'startDeviceTelemetry',
      payload: {child_id, session_id},
      responseTimeoutInSeconds: 30
    };

    this.client.invokeDeviceMethod(device_id, params, cb);
  }

  stopDeviceTelemetry(device_id, cb) {
    if (!this.client)
      return cb('Error while creating iot hub client to communicate with the device', null);

    const params = {
      methodName: 'stoptDeviceTelemetry',
      responseTimeoutInSeconds: 30
    };

    this.client.invokeDeviceMethod(device_id, params, cb);
  }
}

// Singleton, ayy
module.exports = () => {
  if (!instance)
    instance = new Controls();
  return instance;
};