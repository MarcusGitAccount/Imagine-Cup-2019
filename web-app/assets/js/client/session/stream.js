'use strict';

const inSession = window.localStorage.getItem('inSession');

if (inSession && inSession == "true") {
  document.querySelector('#session-controls').classList.add('hidden');
  document.querySelector('#start-simulation').classList.add('hidden');
  document.querySelector('#stop-simulation').classList.remove('hidden');
}

const socket = io.connect(window.location.origin);

// document.querySelector('#ping-device').addEventListener('click', e => {
//   fetch('/api/pingdevice')
//   .then(res => res.json())
//   .then(res => {
//     console.log(res);
//     if (res.error)
//       window.alert(res.error);
//     else
//       window.alert(res.result.payload);
//   })
//   .catch(error => window.alert(error));
// });


// TODO save session id and child id received back from the device in localStorage
document.querySelector('#start-simulation').addEventListener('click', e => {
  const select = document.querySelector('select#select-child');
  const text = document.querySelector('input[type=text]#session-name');
  
  if (!select || !text)
    return handlePromiseErrors('Unable to start simulation.');

  const {device, id} = select.selectedOptions[select.selectedIndex].dataset;
  const name = text.value;
  const body = {
    child_id: id,
    session_name: name,
    device
  };

  fetch('/api/startdevice', {
    method: 'POST',
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })
  .then(res => res.json())
  .then(res => {
    if (res.error)
      return Promise.reject(res.error);
    else {
      document.querySelector('#session-controls').classList.add('hidden');
      text.value = '';
      window.localStorage.setItem('childName', select.selectedOptions[select.selectedIndex].innerHTML);
      window.localStorage.setItem('name', name);
      window.localStorage.setItem('current', res.result.payload);
      window.localStorage.setItem('inSession', true)
      e.target.classList.add('hidden');
      document.querySelector('#stop-simulation').classList.remove('hidden');
      window.alert(res.result.payload);
    }
  })
  .catch(handlePromiseErrors);
});

document.querySelector('#stop-simulation').addEventListener('click', e => {
  if (!window.localStorage.hasOwnProperty('current'))
    return handlePromiseErrors('Unable to stop session');
  if (!JSON.parse(window.localStorage.getItem('current')))
    return handlePromiseErrors('Unable to stop session');
  
  fetch('/api/stopdevice', {
    method: 'POST',
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json'
    },
    body: window.localStorage.getItem('current')
  })
  .then(res => res.json())
  .then(res => {
    if (res.error)
      return Promise.reject(res.error);
    else {
      document.querySelector('#session-controls').classList.remove('hidden');
      window.localStorage.setItem('current', null);
      window.localStorage.setItem('inSession', false)
      e.target.classList.add('hidden');
      document.querySelector('#start-simulation').classList.remove('hidden');
      window.alert('Session stopped'); // or a more elegant way of displaying user messages?
    }
  })
  .catch(handlePromiseErrors);
});

socket.on('datastream-pulse', data => {
  document.querySelector('span#data').innerHTML += `<p>${JSON.stringify(data.data)}</p>`;
});

init();