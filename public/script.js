let ws;

var current_buzzer_sate = true;
var current_laser_sate = true;
var current_light_sate = true;

const moveXSlider = document.getElementById('move-x');
const moveYSlider = document.getElementById('move-y');
const moveXValueDisplay = document.getElementById('move-x-value');
const moveYValueDisplay = document.getElementById('move-y-value');
const laser = document.querySelector('.laser');
const light = document.querySelector('.light');
const buzzer = document.querySelector('.buzzer');
const moveXButton = document.querySelector('.move-x-button');
const moveYButton = document.querySelector('.move-y-button');

moveXSlider.addEventListener('input', () => {
  moveXValueDisplay.textContent = moveXSlider.value;
});

moveYSlider.addEventListener('input', () => {
  moveYValueDisplay.textContent = moveYSlider.value;
});

document.querySelector('.connect-btn').addEventListener('click', () => {
  const host = document.getElementById('host').value;
  const port = document.getElementById('port').value;
  // const clientId = document.getElementById('clientId').value;

  const form = document.getElementById('mqtt-config-form');
  const formData = new FormData(form);

  formData.append('hostname', host);
  formData.append('port', port);

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

// moveXButton.addEventListener('click', () => {
//   const moveX = moveXSlider.value;
//   console.log("moveX", moveX);
//   if (ws && ws.readyState === WebSocket.OPEN) {
//     ws.send(JSON.stringify({ action: 'publish', topic: 'op/move/x', message: moveX }));
//     alert(`Move X: ${moveX}`);
//   } else {
//     alert('Please connect first.');
//   }
// });

// moveYButton.addEventListener('click', () => {
//   const moveY = moveYSlider.value;
//   console.log("moveY", moveY);
//   if (ws && ws.readyState === WebSocket.OPEN) {
//     ws.send(JSON.stringify({ action: 'publish', topic: 'op/move/y', message: moveY }));
//     alert(`Move Y: ${moveY}`);
//   } else {
//     alert('Please connect first.');
//   }
// });

let moveXTimeout;
let moveYTimeout;

moveXSlider.addEventListener('input', () => {
  clearTimeout(moveXTimeout);  
  moveXTimeout = setTimeout(() => {
    const moveX = moveXSlider.value;
    moveXValueDisplay.textContent = moveX; 

    // Send the updated value to the WebSocket
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ action: 'publish', topic: 'op/move/x', message: moveX }));
      box.scrollTop = box.scrollHeight;  // Auto-scroll to the bottom
    } else {
      alert('Please connect first.');
    }
  }, 500); // Delay of 500ms after user stops sliding
});

moveYSlider.addEventListener('input', () => {
  clearTimeout(moveYTimeout);  
  moveYTimeout = setTimeout(() => {
    const moveY = moveYSlider.value;
    moveYValueDisplay.textContent = moveY; 
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ action: 'publish', topic: 'op/move/y', message: moveY }));
      box.scrollTop = box.scrollHeight;  // Auto-scroll to the bottom
    } else {
      alert('Please connect first.');
    }
  }, 500); // Delay of 500ms after user stops sliding
});


laser.addEventListener('click', () => {
  const laserState = current_laser_sate ? 'ON' : 'OFF';
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
  const buzzerState = current_buzzer_sate ? 'ON' : 'OFF';
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
  const lightState = current_light_sate ? 'ON' : 'OFF';
  console.log("current_light_sate", current_light_sate);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ action: 'publish', topic: 'op/light', message: lightState }));
    alert(`Light: ${lightState}`);
    current_light_sate = !current_light_sate;
  } else {
    alert('Please connect first.');
  }
});

function clearFile(inputId) {
  const input = document.getElementById(inputId);
  if (input) {
    input.value = ""; // Clear the selected file
  }
}
