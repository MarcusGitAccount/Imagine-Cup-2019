'use strict';


document.querySelector('#start-simulation').addEventListener('click', e => {
  fetch('/api/data')
  .then(res => res.json())
  .then(res => console.log(res))
  .catch(err => console.log(err));
});