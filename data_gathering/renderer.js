'use strict';

const ipcRenderer = require('electron').ipcRenderer;
const log = (message) => {
  const p = document.createElement('p');

  p.innerHTML = message;
  document.body.appendChild(p);
  return true;
};

ipcRenderer.on('hub-message', (event, store) => {
  log(store);
});