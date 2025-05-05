let ws;

const connectBtn = document.querySelector('.connect-btn');
const disconnectBtn = document.querySelector('.disconnect-btn');
const publishBtn = document.querySelector('.publish-btn');
const subscribeBtn = document.querySelector('.subscribe-btn');
const receiverBox = document.getElementById('receiverBox');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');

var current_buzzer_sate = false;
var current_laser_sate = false;
var current_light_sate = false;

// for the controls
const moveYInput = document.getElementById('move-y')
const moveXInput = document.getElementById('move-x')
const laser = document.querySelector('.leaser');
const light = document.querySelector('.light');
const buzzer = document.querySelector('.buzzer');
const moveXButton = document.querySelector('.move-x-button');
const moveYButton = document.querySelector('.move-y-button');

connectBtn.addEventListener('click', () => {
    const enteredUsername = usernameInput.value;
    const enteredPassword = passwordInput.value;

    // if (!enteredUsername || !enteredPassword) {
    //     alert('Please enter a username and password.');
    //     return;
    // }

    if (ws && ws.readyState === WebSocket.OPEN) {
        // Check if authentication is already in progress
        ws.send(JSON.stringify({
            action: 'auth_check'  // You can send a special action to check if authentication is ongoing
        }));
    }

    ws = new WebSocket('ws://localhost:3001');

    ws.onopen = () => {
        console.log('Connected to Node.js WebSocket Server');
        alert('Connected! Attempting authentication...');
        disconnectBtn.removeAttribute('disabled');
        connectBtn.setAttribute('disabled', true);

        console.log('Sending auth:', enteredUsername, enteredPassword);

        // Send username and password to server for MQTT authentication
        ws.send(JSON.stringify({
            action: 'auth',
            username: enteredUsername,
            password: enteredPassword
        }));

        receiverBox.innerHTML = '';
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Received from server:', data);

        if (data.error) {
            console.error('Error:', data.error);
            alert(data.error);
            ws.close();
            disconnectBtn.setAttribute('disabled', true);
            connectBtn.removeAttribute('disabled');
        } else if (data.status === 'authenticated') {
            alert('Successfully authenticated with MQTT broker.');
            // Enable publish and subscribe buttons after successful authentication if needed
        } else if (data.topic || data.message) {
            const { topic, message } = data;
            let displayMessage = message;

            try {
                const parsed = JSON.parse(message);
                if (typeof parsed === 'object' && parsed !== null) {
                    displayMessage = Object.values(parsed)[0];
                }
            } catch (e) {
                // message is not JSON, use as-is
            }

            const msg = document.createElement('p');
            msg.textContent = `Topic: ${topic} | Message: ${displayMessage}`;
            receiverBox.appendChild(msg);
            receiverBox.scrollTop = receiverBox.scrollHeight;
        }
    };

    ws.onclose = () => {
        console.log('WebSocket disconnected');
        alert('Disconnected!');
        receiverBox.innerHTML = '';
        disconnectBtn.setAttribute('disabled', true);
        connectBtn.removeAttribute('disabled');
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        alert('WebSocket connection error.');
        disconnectBtn.setAttribute('disabled', true);
        connectBtn.removeAttribute('disabled');
    };
});


disconnectBtn.addEventListener('click', () => {
    if (ws) {
        ws.close();
        disconnectBtn.setAttribute('disabled', true);
        connectBtn.removeAttribute('disabled');
    }
});

publishBtn.addEventListener('click', () => {
    const topic = document.getElementById('topic').value;
    const payload = document.getElementById('payload').value;

    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ action: 'publish', topic: topic, message: payload }));
        alert('Message Published!');
    } else {
        alert('Please connect first.');
    }
});

subscribeBtn.addEventListener('click', () => {
    const subTopic = document.getElementById('Subscriber').value;

    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ action: 'subscribe', topic: subTopic }));
        alert(`Subscribed to ${subTopic}`);
    } else {
        alert('Please connect first.');
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