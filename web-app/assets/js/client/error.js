'use strict';

function handlePromiseErrors(error) {
  const errorsContainer = document.querySelector('span#errors');

  if (!errorsContainer) {
    console.log("Couldn't handle error", error);
    return false;
  }
  if (!error || typeof(error) != 'string')
    error = 'Couldn\'t perform action';
  if (errorsContainer)
    errorsContainer.innerHTML += `
      <div class="alert alert-danger alert-dismissible" role="alert">
        <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>
        <strong>Error:</strong> ${error}
      </div>
    `;
  return true;
}