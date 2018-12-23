'use strict';

const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'data.json');
const data = [];

for (let i = 0; i < 15; i++) {
  const content = {
    pulse: (Math.random() * 130) | 0,
    comment: 'Data sent in development.',
    child_id: 0,
    session_id: 0,
    data_time: new Date()
  };

  data.push(content);
}

fs.writeFile(file, JSON.stringify(data), error => console.log('Error while writing file:', error));