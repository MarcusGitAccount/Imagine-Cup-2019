
'use strict';

const request = require('request');
const fs = require('fs');

// Replace <Subscription Key> with your valid subscription key.
const subscriptionKey = 'd874d47b210e48978fe0acf7cef402bf';

// You must use the same location in your REST call as you used to get your
// subscription keys. For example, if you got your subscription keys from
// westus, replace "westcentralus" in the URL below with "westus".
const uriBase = 'https://westcentralus.api.cognitive.microsoft.com/face/v1.0/detect';4
var currentPath = process.cwd();

const imageUrl = currentPath + '/test_picture.jpg';

// Request parameters.
const params = {
    'returnFaceId': 'true',
    'returnFaceLandmarks': 'false',
    'returnFaceAttributes': 'emotion'
};

const options = {
    uri: uriBase,
    qs: params,
    body: fs.createReadStream(imageUrl),
    headers: {
        'Content-Type': 'application/octet-stream',
        'Ocp-Apim-Subscription-Key' : subscriptionKey
    }
};

request.post(options, (error, response, body) => {
  if (error) {
    console.log('Error: ', error);
    return;
  }
  let jsonResponse = JSON.stringify(JSON.parse(body), null, '  ');
  console.log('JSON Response\n');
  console.log(jsonResponse);
});