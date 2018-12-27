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

  async pingDevice(device_id) {
    if (!this.client)
      return Promise.reject('Error while creating iot hub client to communicate with the device');

    const params = {
      methodName: 'pingDevice',
      responseTimeoutInSeconds: 30,
      payload: 'ping'
    };

    return this.client.invokeDeviceMethod(device_id, params);
  }

  async startDeviceTelemetry(device_id, child_id = null, session_id = null) {
    if (!this.client)
      return Promise.reject('Error while creating iot hub client to communicate with the device');

    const params = {
      methodName: 'startDeviceTelemetry',
      payload: {child_id, session_id},
      responseTimeoutInSeconds: 30
    };

    return this.client.invokeDeviceMethod(device_id, params);
  }

  async stoptDeviceTelemetry(device_id) {
    if (!this.client)
      return Promise.reject('Error while creating iot hub client to communicate with the device');

    const params = {
      methodName: 'stoptDeviceTelemetry',
      responseTimeoutInSeconds: 30
    };

    return this.client.invokeDeviceMethod(device_id, params);
  }
}

// Singleton, ayy
module.exports = () => {
  if (!instance)
    instance = new Controls();
  return instance;
};