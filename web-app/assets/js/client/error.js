'use strict';

function handlePromiseErrors(error) {
  const errorsContainer = document.querySelector('#errors');

  if (!errorsContainer) {
    console.log("Couldn't handle error", error);
    return false;
  }
  if (!error || typeof(error) != 'string')
    error = 'Couldn\'t perform action';
  if (errorsContainer) {
    const div = document.createElement('div');

    div.setAttribute('title', 'Alert will disappear in 10 seconds if not dismissed.');
    div.setAttribute('role', 'alert');
    div.className = 'alert alert-danger alert-dismissible';
    div.innerHTML = `
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
        <strong>Error:</strong> ${error}
    `;
    errorsContainer.appendChild(div);
    window.scrollTo({ top: 0, behavior: 'smooth' })
    window.setTimeout(() => {
      if (div && div.parentNode && div.parentNode == errorsContainer) {
        errorsContainer.removeChild(div);
        console.log('Alert disappeared.');
      }
    }, 10 * 1000);
  }
  return true;
}