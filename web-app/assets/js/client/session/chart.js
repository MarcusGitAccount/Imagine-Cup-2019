'use strict';

const canvas = document.querySelector("#chart");
const ctx = canvas.getContext('2d');
const config = {
  type: 'line',
  data: {
    labels: [],
    datasets: [{
      label: 'Heartrate',
      backgroundColor: '#ffffff',
      borderColor: '#ff0000',
      fill: false,
      cubicInterpolationMode: 'monotone',
      borderDash: [8, 4],
      data: []
    }]
  }
};

const container = canvas.parentNode;
const bounds = container.getBoundingClientRect();
const width = bounds.width - 30;
const height = (window.outerHeight / 3) | 0;

canvas.setAttribute('width', width.toString());
canvas.setAttribute('height', height);
canvas.setAttribute('title', 'Displaying data aquired during different session times.');

const chart = new Chart(ctx, config);
chart.render();

const socket = io.connect(window.location.origin);

socket.on('datastream-pulse', data => { 
  const {pulse, data_time} = data.data;

  if (chart) {
    const x = moment(data_time).format('HH:mm:ss');
    const y = pulse;
    
    if (chart.data.labels.length >= 10) {
      chart.data.labels.shift();
      chart.data.datasets[0].data.shift();
    }

    chart.data.datasets[0].data.push(y);
    chart.data.labels.push(x);
    chart.update();
  }
});