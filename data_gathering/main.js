'use strict';

const connectionString = "HostName=MiBandData.azure-devices.net;SharedAccessKeyName=iothubowner;SharedAccessKey=qwoUvvYRrA4Zegb3Q+0zv4NCKwRIDC8fDS8fmq5VMVw=";
const Mqtt = require('azure-iot-device-mqtt').Mqtt;
const DeviceClient = require('azure-iot-device').Client
const Message = require('azure-iot-device').Message;
const client = DeviceClient.fromConnectionString(connectionString, Mqtt);

const fs = require('fs');
const path = require('path');

const sampleFileName = 'sample_2';
const samplePath = path.join(__dirname, 'heartrate', sampleFileName);

let samples = [];
let index = 0;

// Timeout created by setInterval
let intervalLoop = null;

const {app, BrowserWindow} = require('electron');

let mainWindow = null;

function log(message) {
  if (mainWindow) {
    mainWindow.webContents.send('hub-message', message);
  }
  console.log(message);
}

function createWindow () {
  mainWindow = new BrowserWindow({width: 800, height: 600});
  mainWindow.loadFile('index.html');
  mainWindow.on('closed', function () {
    mainWindow = null;
  })
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
})

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
})

function funcFactory(request, response) {
  function directMethodResponse(err) {
    if(err) {
      log('An error ocurred when sending a method response:\n' + err.toString());
    } else {
      log('Response to method \'' + request.methodName + '\' sent successfully.' );
    }
  }

  return directMethodResponse;
}

function onStartDeviceTelemetry(request, response) {
  const directMethodResponse = funcFactory(request, response);

  // Function to send a direct method reponse to your IoT hub.
  log('Starting sending telemtry using the following payload:');
  log(JSON.stringify(request.payload));

  // Check that a numeric value was passed as a parameter
  if (!request.payload) {
    log('Invalid interval response received in payload');
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

  log('Direct method payload received:');
  log(request.payload);

  clearInterval(intervalLoop);
  intervalLoop = null;
  response.send(200, 'Stopped sending telemetry', directMethodResponse);
}

function onPingDevice(request, response) {
  const directMethodResponse = funcFactory(request, response);

  // Function to send a direct method reponse to your IoT hub.
  log('Direct method payload received:');
  log(request.payload);

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
      return log('Error sending message.');
    else
      log('Successfully read emotions sample from file.');

    const json = JSON.parse(data);

    if (!json || !json[0] || !json[0].faceAttributes)
      return log('Not sending this message. Invalid emotions sample.');
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

    log('Parsed emotion sample and created the message.');    
    log('Sending message: ' + message.getData());
    
    // Send the message.
    client.sendEvent(message, function (err) {
      if (err) {
        log('send error: ' + err.toString());
      } else {
        log('message sent\n');
      }
    });
  });
}

fs.readFile(samplePath, 'utf-8', (err, data) => {
  if (err) {
    return log('Unable to read from' + samplePath);
  }

  samples = data.split('\n').filter(x => x).map(x => parseFloat(x, 10) | 0);

  if (samples.indexOf(undefined) == -1 && samples.length == 1800)
    log('Succesfully read heartrate sample data.');

  client.onDeviceMethod('startDeviceTelemetry', onStartDeviceTelemetry);
  client.onDeviceMethod('stoptDeviceTelemetry', onStopDeviceTelemetry);
  client.onDeviceMethod('pingDevice', onPingDevice);

  log('Everything set up.');
});