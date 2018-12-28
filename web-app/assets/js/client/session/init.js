'use strict';

function handlePromiseErrors(error) {
  const errorsContainer = document.querySelector('span#errors');

  if (errorsContainer)
    errorsContainer.innerHTML += `<p class="error">Error: ${error}</p>`;
}

function init() {
  fetch('/api/children')
    .then(res => res.json())
    .then(res => {
      const select = document.querySelector('#select-child');

      if (res.error)
        return Promise.reject(res.error);
      if (!select)
        return Promise.reject('Select element doesn\'t exist.');

      for (const child of res.data) {
        const {device, name, child_id} = child;

        select.innerHTML += `
          <option data-device=${device} data-id=${child_id}>${name}</option>
        `;
      }
    })
    .catch(handlePromiseErrors);
}

function initMiscellaneousEvents() {
  let select = null;
  let status = null;

  if (!(select = document.querySelector('#select-child')))
    return handlePromiseErrors('Select element doesn\'t exist on the page.');
  if (!(status = document.querySelector('#session-ping-status')))
    return handlePromiseErrors('Status element doesn\'t exist on the page.');

  select.addEventListener('change', e => {
    status.innerHTML = 'unchecked.';
    status.classList.remove('working');
    status.classList.remove('error');
  });
}

function pingStatusPositive() {
  let status = null;

  if (!(status = document.querySelector('#session-ping-status')))
    return handlePromiseErrors('Status element doesn\'t exist on the page.');

  status.innerHTML = 'device connected and working.';
  status.classList.add('working');
  status.classList.remove('error');
}

function pingStatusNegative() {
  let status = null;

  if (!(status = document.querySelector('#session-ping-status')))
    return handlePromiseErrors('Status element doesn\'t exist on the page.');

  status.innerHTML = 'device not working.';
  status.classList.remove('working');
  status.classList.add('error');
}