let ws;

var current_buzzer_sate = false;
var current_laser_sate = false;
var current_light_sate = false;

const moveYInput = document.getElementById('move-y');
const moveXInput = document.getElementById('move-x');
const laser = document.querySelector('.leaser');
const light = document.querySelector('.light');
const buzzer = document.querySelector('.buzzer');
const moveXButton = document.querySelector('.move-x-button');
const moveYButton = document.querySelector('.move-y-button');

document.querySelector('.connect-btn').addEventListener('click', () => {
  const form = document.getElementById('mqtt-config-form');
  const formData = new FormData(form);

  fetch('/upload-certs', {
    method: 'POST',
    body: formData
  })
    .then(res => res.json())
    .then(data => {
      if (data.error === 'mosquitto_down') {
        alert('Mosquitto broker is not running.');
      } else if (data.error === 'cert_failed') {
        alert('Certificate authentication failed. Check your client.key, client.crt, or ca.crt.');
      } else {
        startWebSocket();
      }
    })
    .catch(err => alert('Cert Upload Failed: ' + err));
});

function startWebSocket() {
  ws = new WebSocket('ws://localhost:3001');

  ws.onopen = () => alert('WebSocket Connected');

  ws.onmessage = (event) => {
    const { topic, message, error } = JSON.parse(event.data);
    if (error) {
      alert(error);
      return;
    }

    const box = document.getElementById('receiverBox');
    const msg = document.createElement('p');
    msg.textContent = `Topic: ${topic} | Message: ${message}`;
    box.appendChild(msg);
    box.scrollTop = box.scrollHeight;
  };

  ws.onclose = () => alert('WebSocket Disconnected');
}

document.querySelector('.disconnect-btn').addEventListener('click', () => {
  if (ws) ws.close();
  alert('WebSocket Disconnected');
});

document.querySelector('.publish-btn').addEventListener('click', () => {
  const topic = document.getElementById('topic').value;
  const payload = document.getElementById('payload').value;

  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ action: 'publish', topic, message: payload }));
    alert(`Published to ${topic}`);
  } else {
    alert('Connect first!');
  }
});

document.querySelector('.subscribe-btn').addEventListener('click', () => {
  const topic = document.getElementById('Subscriber').value;

  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ action: 'subscribe', topic }));
    alert(`Subscribed to ${topic}`);
  } else {
    alert('Connect first!');
  }
});

moveXButton.addEventListener('click', () => {
  const moveX = moveXInput.value;
  console.log("moveX", moveX);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ action: 'publish', topic: 'op/move/x', message: moveX }));
    alert(`Move X: ${moveX}`);
  } else {
    alert('Please connect first.');
  }
});

moveYButton.addEventListener('click', () => {
  const moveY = moveYInput.value;
  console.log("moveY", moveY);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ action: 'publish', topic: 'op/move/y', message: moveY }));
    alert(`Move Y: ${moveY}`);
  } else {
    alert('Please connect first.');
  }
});

laser.addEventListener('click', () => {
  const laserState = current_laser_sate ? 'on' : 'off';
  console.log("current_laser_sate", current_laser_sate);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ action: 'publish', topic: 'op/laser', message: laserState }));
    alert(`Laser: ${laserState}`);
    current_laser_sate = !current_laser_sate;
  } else {
    alert('Please connect first.');
  }
});

buzzer.addEventListener('click', () => {
  const buzzerState = current_buzzer_sate ? 'on' : 'off';
  console.log("current_buzzer_sate", current_buzzer_sate);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ action: 'publish', topic: 'op/buzzer', message: buzzerState }));
    alert(`Buzzer: ${buzzerState}`);
    current_buzzer_sate = !current_buzzer_sate;
  } else {
    alert('Please connect first.');
  }
});

light.addEventListener('click', () => {
  const lightState = current_light_sate ? 'on' : 'off';
  console.log("current_light_sate", current_light_sate);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ action: 'publish', topic: 'op/light', message: lightState }));
    alert(`Light: ${lightState}`);
    current_light_sate = !current_light_sate;
  } else {
    alert('Please connect first.');
  }
});
