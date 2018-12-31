'use strict';

function addQuestionInSessionSelect(id, questionBody) {
  const li = document.createElement('li');
  const body = document.createElement('span');
  const btn  = document.createElement('span');

  li.className = '';
  body.className = 'question-body';
  btn.className = 'add-question-btn';

  body.innerHTML=  questionBody;
  btn.innerHTML = 'Add';

  li.dataset.id = id;
  btn.addEventListener('click', e => {
    const parent = e.target.parentNode;
    const body = parent.querySelector('span.question-body').innerHTML;

    addQuestionToSession(parent.dataset.id, body);
    parent.parentNode.removeChild(parent);
  });

  li.appendChild(body);
  li.appendChild(btn);
  return li;
}

function addQuestionToSession(id, questionBody) {
  const ul = document.querySelector('#session-questions');
  const li = document.createElement('li');
  const body = document.createElement('span');
  const asked  = document.createElement('span');
  const remove  = document.createElement('span');

  li.title = 'Not asked yet';
  li.className = '';
  body.className = 'question-body';
  asked.className = 'asked-question-btn';
  remove.className = 'remove-question-btn';

  body.innerHTML = questionBody;
  asked.innerHTML = 'Ask';
  remove.innerHTML = 'Remove';

  li.dataset.id = id;
  remove.addEventListener('click', e => {
    const parent = e.target.parentNode;
    const body = parent.querySelector('span.question-body').innerHTML;

    parent.parentNode.removeChild(parent);
    document.querySelector('#available-questions').appendChild(addQuestionInSessionSelect(parent.dataset.id, body));
  });

  asked.addEventListener('click', e => {
    if (window.localStorage.getItem('inSession') == 'false')
      return false;

    const parent = e.target.parentNode;
    const {session_id} = JSON.parse(window.localStorage.getItem('current'));
    const question_id = parent.dataset.id;

    fetch('/api/session_question', {
      method: 'POST',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({question_id, session_id})
    })
      .then(res => res.json())
      .then(res => {
        parent.title = 'Question already asked this session.';
        parent.classList.add('asked');
        parent.removeChild(e.target);
        parent.removeChild(parent.querySelector('.remove-question-btn'));
      })
      .catch(handlePromiseErrors);
  });

  li.appendChild(body);
  li.appendChild(asked);
  li.appendChild(remove);
  ul.appendChild(li);
}

function handlePromiseErrors(error) {
  const errorsContainer = document.querySelector('span#errors');

  if (typeof(error) != 'string')
    error = 'Couldn\'t perform action';
  if (errorsContainer)
    errorsContainer.innerHTML += `<p class="error">Error: ${error}</p>`;
}

async function fetchInitialData() {
  try {
    const data = await Promise.
      all(['/api/children', '/api/questions'].map(url => {
        return fetch(url).then(res => res.json());
      }));

    return data;
  }
  catch (err) {
    handlePromiseErrors(err);
    return null;
  }
}

async function init() {
  document.querySelector('#select-child').innerHTML = '<option>Fetching data</option>'
  document.querySelector('#available-questions').innerHTML = 'Fetching data';

  await fetch('/api/children')
    .then(res => res.json())
    .then(res => {
      const select = document.querySelector('#select-child');

      select.innerHTML = '';
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

  await fetch('/api/questions')
    .then(res => res.json())
    .then(res => {
      const ul = document.querySelector('#available-questions');

      ul.innerHTML = '';
      if (res.error)
        return Promise.reject(res.error);
      if (!ul)
        return Promise.reject('Questions ul element doesn\'t exist.');

      for (const question of res.data) {
        const {question_id, question_body} = question;

        ul.appendChild(addQuestionInSessionSelect(question_id, question_body));
      }
    })
    .catch(handlePromiseErrors);
}

function initMiscellaneousEvents() {
  selectChildrenEvents();
  createQuestionEvents();
}

function createQuestionEvents() {
  document.querySelector('form#new-question').addEventListener('submit', e => {
    e.preventDefault();

    const question_body = document.querySelector('input[name=new-question]').value;

    console.log(question_body);
    fetch('/api/questions', {
      method: 'POST',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({question_body})
    })
      .then(res => res.json())
      .then(res => {
        const ul = document.querySelector('#available-questions');

        if (res.error)
          return Promise.reject(res.error);
        if (!ul)
          return Promise.reject('Questions ul element doesn\'t exist.');

        ul.appendChild(addQuestionInSessionSelect(res.question_id, res.question_body));
      })
      .catch(handlePromiseErrors);

    return false;
  });
}

function selectChildrenEvents() {
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