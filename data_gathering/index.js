// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';

const chalk = require('chalk');


var NodeWebcam = require( "node-webcam" );


 
var opts = {
  width: 1280,
  height: 720,
  quality: 100,
  delay: 0,
  saveShots: true,
  output: "jpeg",
  device: false,
  callbackReturn: "location",
  verbose: false

};


//Creates webcam instance

var Webcam = NodeWebcam.create( opts );

Webcam.capture( "test_picture", function( err, data ) {} );

const connectionString = "HostName=MiPiHub.azure-devices.net;DeviceId=Pi_0000;SharedAccessKey=wwZFGxb1+hijvU40/G9PrLr/qPeZLlszKL2XMNezkK4=";

const Mqtt = require('azure-iot-device-mqtt').Mqtt;
const DeviceClient = require('azure-iot-device').Client
const Message = require('azure-iot-device').Message;

const client = DeviceClient.fromConnectionString(connectionString, Mqtt);

// Timeout created by setInterval
let intervalLoop = null;

function funcFactory(request, response) {
  function directMethodResponse(err) {
    if(err) {
      console.error(chalk.red('An error ocurred when sending a method response:\n' + err.toString()));
    } else {
      console.log(chalk.green('Response to method \'' + request.methodName + '\' sent successfully.' ));
    }
  }

  return directMethodResponse;
}

function onStartDeviceTelemetry(request, response) {
  const directMethodResponse = funcFactory(request, response);

  // Function to send a direct method reponse to your IoT hub.
  console.log(chalk.green('Starting sending telemtry using the following payload:'));
  console.log(chalk.green(JSON.stringify(request.payload)));

  // Check that a numeric value was passed as a parameter
  if (!request.payload) {
    console.log(chalk.red('Invalid interval response received in payload'));
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

  console.log(chalk.green('Direct method payload received:'));
  console.log(chalk.green(request.payload));

  clearInterval(intervalLoop);
  intervalLoop = null;
  response.send(200, 'Stopped sending telemetry', directMethodResponse);
}

function onPingDevice(request, response) {
  const directMethodResponse = funcFactory(request, response);

  // Function to send a direct method reponse to your IoT hub.
  console.log(chalk.green('Direct method payload received:'));
  console.log(chalk.green(request.payload));

  clearInterval(intervalLoop);
  intervalLoop = null;
  response.send(200, 'Pong', directMethodResponse);
}

// Send a telemetry message to your hub
function sendMessage(child_id, session_id) {
  // Simulate telemetry.
  const message = new Message(JSON.stringify({
    pulse: (Math.random() * 130) | 0,
    comment: 'Data sent in development.',
    data_time: new Date(),
    child_id,
    session_id
  }));

  console.log('Sending message: ' + message.getData());

  // Send the message.
  client.sendEvent(message, function (err) {
    if (err) {
      console.error('send error: ' + err.toString());
    } else {
      console.log('message sent');
    }
  });
}

// Set up the handler for the SetTelemetryInterval direct method call.
client.onDeviceMethod('startDeviceTelemetry', onStartDeviceTelemetry);
client.onDeviceMethod('stoptDeviceTelemetry', onStopDeviceTelemetry);
client.onDeviceMethod('pingDevice', onPingDevice);

console.log('Setting everything up.');