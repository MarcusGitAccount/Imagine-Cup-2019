'use strict';

function handlePromiseErrors(error) {
  const errorsContainer = document.querySelector('span#errors');

  if (!errorsContainer) {
    console.log("Couldn't handle error", error);
    return false;
  }
  if (typeof(error) != 'string')
    error = 'Couldn\'t perform action';
  if (errorsContainer)
    errorsContainer.innerHTML += `<p class="error">Error: ${error}</p>`;
  return true;
}