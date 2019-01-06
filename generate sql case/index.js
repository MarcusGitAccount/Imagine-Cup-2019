'use strict';

// Given a table with some columns generate when cases
// to select the column and its name with maximum value among
// all the columns.

const fs = require('fs');
const path = require('path');
const columns = ["anger", "contempt", "disgust", "fear", "happiness", "neutral", "sadness", "surprise"];

function getCase(columns, alias) {
  if (!columns || columns.length == 0)
    return '';

  const rows = [];
  for (let i = 0; i < columns.length; i++) {
    const row = [];
    for (let j = 0; j < columns.length; j++) {
      if (i == j)
        continue;
  
      row.push(`${columns[i]} >= ${columns[j]}`)
    }
  
    rows.push(`when ${row.join(' and ')} then ${columns[i]}`);
  }

  return `
  case
  ${rows.join('\n')}
  else ${columns[0]}
  end as ${alias}
  `;
}

fs.writeFile(path.join(__dirname, 'result'), getCase(columns, 'dominant_emotion'), err => {
  if (err)
    return console.log('Error');
  return console.log('Success');
})