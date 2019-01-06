'use strict';

(async () => {
  const inSession = window.localStorage.getItem('inSession');

  if (inSession && inSession == "true") {
    document.querySelector('#session-controls').classList.add('hidden');
    document.querySelector('#start-simulation').classList.add('hidden');
    document.querySelector('#stop-simulation').classList.remove('hidden');
    document.querySelector('form#new-note').classList.add('hidden');
  }

  document.querySelector('#ping-device').addEventListener('click', e => {
    const select = document.querySelector('select#select-child');
    
    if (!select || !select.childElementCount)
      return handlePromiseErrors('Unable to ping.');

    const {device} = select[select.selectedIndex].dataset;

    fetch('/api/pingdevice', {
      method: 'POST',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({device})
    })
      .then(res => res.json())
      .then(res => {
        if (res.error)
          return Promise.reject(res.error);
        pingStatusPositive();
      })
      .catch(error => pingStatusNegative());
  });


  // TODO save session id and child id received back from the device in localStorage
  document.querySelector('#start-simulation').addEventListener('click', e => {
    const select = document.querySelector('select#select-child');
    const text = document.querySelector('input[type=text]#session-name');
    
    if (!select || !text)
      return handlePromiseErrors('Unable to start simulation.');

    const {device, id} = select[select.selectedIndex].dataset;
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
        document.title = `Current session: ${text.value}`;
        text.value = '';
        window.localStorage.setItem('device', device);
        window.localStorage.setItem('childName', select[select.selectedIndex].innerHTML);
        window.localStorage.setItem('name', name);
        window.localStorage.setItem('current', res.result.payload);
        window.localStorage.setItem('inSession', true);
        
        e.target.classList.add('hidden');
        document.querySelector('#session-controls').classList.add('hidden');
        document.querySelector('#stop-simulation').classList.remove('hidden');
        document.querySelector('form#new-note').classList.remove('hidden');
        window.alert('Session started.');
      }
    })
    .catch(handlePromiseErrors);
  });

  document.querySelector('#stop-simulation').addEventListener('click', e => {
    if (!window.localStorage.hasOwnProperty('current'))
      return handlePromiseErrors('Unable to stop session');
    if (!JSON.parse(window.localStorage.getItem('current')))
      return handlePromiseErrors('Unable to stop session');
    
    const body = JSON.parse(window.localStorage.getItem('current'));

    body['device'] = window.localStorage.getItem('device');
    fetch('/api/stopdevice', {
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
        window.localStorage.setItem('current', null);
        window.localStorage.setItem('inSession', false)
        
        document.querySelector('#session-controls').classList.remove('hidden');
        document.querySelector('form#new-note').classList.add('hidden');
        document.querySelector('#start-simulation').classList.remove('hidden');
        e.target.classList.add('hidden');
        window.alert('Session stopped'); // or a more elegant way of displaying user messages?
      }
      return Promise.resolve('done');
    })
    .then(_ => {
      const {session_id} = body;
      const anchor = document.createElement('a');

      anchor.setAttribute('target', '_blank');
      anchor.setAttribute('href', `/app/result/${session_id}`);
      anchor.click();
    })
    .catch(handlePromiseErrors);
  });

  await init();
  initMiscellaneousEvents();
})();