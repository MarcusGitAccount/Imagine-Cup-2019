// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';

const connectionString = "HostName=MiPiHub.azure-devices.net;DeviceId=Pi_0000;SharedAccessKey=wwZFGxb1+hijvU40/G9PrLr/qPeZLlszKL2XMNezkK4=";
const Mqtt = require('azure-iot-device-mqtt').Mqtt;
const DeviceClient = require('azure-iot-device').Client
const Message = require('azure-iot-device').Message;
const client = DeviceClient.fromConnectionString(connectionString, Mqtt);

const fs = require('fs');
const path = require('path');

const sampleFileName = 'sample_1';
let samples = [];
let index = 0;

// Timeout created by setInterval
let intervalLoop = null;

function funcFactory(request, response) {
  function directMethodResponse(err) {
    if(err) {
      console.error('An error ocurred when sending a method response:\n' + err.toString());
    } else {
      console.log('Response to method \'' + request.methodName + '\' sent successfully.' );
    }
  }

  return directMethodResponse;
}

function onStartDeviceTelemetry(request, response) {
  const directMethodResponse = funcFactory(request, response);

  // Function to send a direct method reponse to your IoT hub.
  console.log('Starting sending telemtry using the following payload:');
  console.log(JSON.stringify(request.payload));

  // Check that a numeric value was passed as a parameter
  if (!request.payload) {
    console.log('Invalid interval response received in payload');
    // Report failure back to your hub.
    response.send(400, 'Invalid direct method parameter: ' + request.payload, directMethodResponse);

  } else {
    const {child_id, session_id} = request.payload;

    // Reset the interval timer
    clearInterval(intervalLoop);
    intervalLoop = setInterval(() => {
      sendMessage(child_id, session_id);
    }, 1000);

    // Report success back to your hub.
    response.send(200, JSON.stringify({session_id, child_id}), directMethodResponse);
  }
}

function onStopDeviceTelemetry(request, response) {
  const directMethodResponse = funcFactory(request, response);

  console.log('Direct method payload received:');
  console.log(request.payload);

  clearInterval(intervalLoop);
  intervalLoop = null;
  response.send(200, 'Stopped sending telemetry', directMethodResponse);
}

function onPingDevice(request, response) {
  const directMethodResponse = funcFactory(request, response);

  // Function to send a direct method reponse to your IoT hub.
  console.log('Direct method payload received:');
  console.log(request.payload);

  clearInterval(intervalLoop);
  intervalLoop = null;
  response.send(200, 'Pong', directMethodResponse);
}

// Send a telemetry message to your hub
function sendMessage(child_id, session_id) {
  // Simulate telemetry.
  const randomFileNo = (Math.random() * 100 + 1) | 0; 

  fs.readFile(path.join(__dirname, 'results100', `a${randomFileNo}.json`), 'utf-8', (err ,data) => {
    if (err)
      return console.log('Error sending message.');
    else
      console.log('Successfully read emotions sample from file.');

    const json = JSON.parse(data);

    if (!json || !json[0] || !json[0].faceAttributes)
      return console.log('Not sending this message. Invalid emotions sample.');
    if (index >= samples.length)
      index = 0;
    else
      index++;
    
    const {emotion} = json[0].faceAttributes;
    const message = new Message(JSON.stringify({
      pulse: samples[index] | 0,
      comment: 'Data sent in development.',
      data_time: new Date(),
      child_id,
      session_id,
      ...emotion
    })); 

    console.log('Parsed emotion sample and created the message.');    
    console.log('Sending message: ' + message.getData());
    
    // Send the message.
    client.sendEvent(message, function (err) {
      if (err) {
        console.error('send error: ' + err.toString());
      } else {
        console.log('message sent\n');
      }
    });
  });
}

const samplePath = path.join(__dirname, 'heartrate', sampleFileName);

fs.readFile(samplePath, 'utf-8', (err, data) => {
  if (err) {
    return console.log('Unable to read from' + samplePath);
  }

  samples = data.split('\n').filter(x => x).map(x => parseFloat(x, 10) | 0);

  if (samples.indexOf(undefined) == -1 && samples.length == 1800)
    console.log('Succesfully read heartrate sample data.');

  client.onDeviceMethod('startDeviceTelemetry', onStartDeviceTelemetry);
  client.onDeviceMethod('stoptDeviceTelemetry', onStopDeviceTelemetry);
  client.onDeviceMethod('pingDevice', onPingDevice);

  console.log('Setting everything up.');
});