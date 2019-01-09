'use strict';

function fetchJSON(url, body) {
  return fetch(url, body).then(res => res.json());
}

async function fetchData(data) {
  const body = {
    method: 'POST',
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      session_id: parseInt(window.localStorage.result_session_id, 10),
      child_id:   parseInt(window.localStorage.result_session_child_id, 10),
    })
  };

  await fetchJSON('/api/result/session', body)
    .then(res => {
      if (res.error)
        return Promise.reject(res.error);

      document.querySelector('#session_name').innerHTML  = res.data.session_name;
      document.querySelector('#session_child').innerHTML  = res.data.child_name;
      document.querySelector('#session_user').innerHTML  = res.data.createdby;
      document.querySelector('#session_start').innerHTML = moment(res.data.start_time).calendar();
      document.querySelector('#session_end').innerHTML   = moment(res.data.end_time).calendar();

      window.localStorage.setItem('session_data_result', JSON.stringify(res.data));
    })
    .catch(handlePromiseErrors);

  await fetchJSON('/api/result/notes', body)
    .then(res => {
      const ul = document.querySelector('div#notes > ul');
      
      if (res.error)
        return Promise.reject(res.error);
      if (!ul)
        return Promise.reject('List group doesn\'t exist.');
      if (!res.data || res.data.length == 0) {
        ul.innerHTML = 'No notes recorded.';
        return;
      }

      ul.innerHTML = '';
      for (const note of res.data) {
        const li = document.createElement('li');
        const span = document.createElement('span');

        li.className = 'list-group-item note-li';
        span.className = 'badge note-elapsed-time';

        li.innerHTML = note.note_body;
        span.innerHTML = moment(note.elapsed_time).format('mm:ss');
        span.setAttribute('title', 'Elapsed time since the start of the session.');

        li.appendChild(span);
        ul.appendChild(li);
      }
    })
    .catch(handlePromiseErrors);

  await fetchJSON('/api/result/questions', body)
    .then(res => {
      const container = document.querySelector('.container#questions');

      if (res.error)
        return Promise.reject(res.error);
      if (!container)
        return Promise.reject('No container found to display table data.');
      if (res.data.length == 0)
        container.querySelector('.panel-body').innerHTML = 'No questions asked during this session.';
      else
        container.querySelector('.panel-body').innerHTML = `
          Data acquired for each question during this session is displayed. <br>
          For each question you can compare the child's metric during other sessions to see if he/she improved.
        `;

      const emotion = (set) => {
        if (!set || !set.dominant_emotion)
          return 'Not registered';
        return `${set.dominant_emotion} (${(set.dominant_emotion_value * 100) | 0}%)`
      };

      const body = container.querySelector('tbody');
      for (let i = 0; i < res.data.length; i++) {
        const tr = document.createElement('tr');
        const data = res.data[i];

        tr.innerHTML = `
          <th>${i}</th>
          <th title="Owner of the qeustion">${data.createdby}</th>
          <th title="Biometrical response to this question: average pulse after the question was asked.">${data.avg_pulse}</th>
          <th title="Emotional response to this question: main emotion registered and the confindence level of its">${emotion(data)}</th>
          <th title="Actual question"${data.question_body}">${data.question_body}</th>
          <th title="Name of the session">${data.session_name}</th>
          <th>
            <a class="comp-question" title="Click to compare">Compare</a>
          </th>
        `;
        tr.dataset.id = data.question_id;
        const compareFunction =  e => {
          const _body = {
            method: 'POST',
            headers: {
              'Accept': 'application/json, text/plain, */*',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              session_id: parseInt(window.localStorage.result_session_id, 10),
              child_id:   parseInt(window.localStorage.result_session_child_id, 10),
              question_id: parseInt(e.target.parentNode.parentNode.dataset.id, 10)
            })
          };

          fetchJSON('/api/result/other_questions', _body)
            .then(res => {
              if (res.error)
                return Promise.reject(res.error);
              if (!res || res.data.length == 0)
                return window.alert('This question was not asked in other sessions.');
              
              for (const data of res.data) {
                const tr = document.createElement('tr');

                tr.innerHTML = `
                  <th>-</th>
                  <th title="Owner of the qeustion">${data.createdby}</th>
                  <th title="Biometrical response to this question: average pulse after the question was asked.">${data.avg_pulse}</th>
                  <th title="Emotional response to this question: main emotion registered and the confindence level of its">${emotion(data)}</th>
                  <th title="Actual question"${data.question_body}">-</th>
                  <th title="Name of the session">${data.session_name}</th>
                  <th>-</th>
                `;
                tr.dataset.id = data.question_id;
                tr.dataset.compared = "true";
                tr.setAttribute('class', 'compared-to');
                e.target.parentNode.parentNode.insertAdjacentElement('afterend', tr);
              }
              return Promise.resolve('done');
            })
            .then(_ => {
              e.target.removeEventListener('click', compareFunction, false);
              e.target.setAttribute('title', 'Question already asked.');
            })
            .catch(handlePromiseErrors);
        }

        tr.querySelector('a.comp-question').addEventListener('click', compareFunction, false);
        body.appendChild(tr);
      }
    })
    .catch(handlePromiseErrors);

  await fetchJSON('/api/result/data', body)
    .then(res => {
      const container = document.querySelector('.container#data');

      if (res.error)
        return Promise.reject(res.error);
      if (!container)
        return Promise.reject('Data container doesn\'t exist.');
      

      const bounds = container.getBoundingClientRect();
      const width = bounds.width - 30;
      const height = (window.outerHeight / 3) | 0;
      const canvas = container.querySelector('canvas');
      const labels = [];
      const data = [];
      
      if (!canvas)
        return Promise.reject('Canvas element doesn\'t exist on the page.');

      canvas.setAttribute('width', width.toString());
      canvas.setAttribute('height', height);
      // canvas.setAttribute('title', 'Displaying data aquired during different session times.');

      for (const pair of res.data) {
        const {data_time, pulse} = pair;

        data.push(pulse);
        labels.push(moment(labels.length * 1000 * 5).format('m:ss'));
      }
      
      const context = canvas.getContext('2d');
      const config = {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Heartrate',
            backgroundColor: '#ffffff',
            borderColor: '#ff0000',
            fill: false,
            cubicInterpolationMode: 'monotone',
            borderDash: [8, 4],
            data: data
          }]
        },
        options: {
          legend: {
            labels: {
              defaultFontStyle: 'bold',
              fontColor: 'black'
            }
          }
        }
      };
      const chart = new Chart(context, config);
      chart.render();
      document.querySelector('.container#loading').classList.add('hidden');
    })
    .catch(handlePromiseErrors);
}

fetchData();