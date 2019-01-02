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
    body: JSON.stringify({session_id: parseInt(window.localStorage.result_session_id, 10)})
  };

  await fetchJSON('/api/result/session', body)
    .then(res => {
      if (res.error)
        return Promise.reject(res.error);

      document.querySelector('#session_name').innerHTML  = res.data.session_name;
      document.querySelector('#session_start').innerHTML = moment(res.data.start_time).calendar();
      document.querySelector('#session_end').innerHTML   = moment(res.data.end_time).calendar();
    })
    .catch(handlePromiseErrors);
}

fetchData();