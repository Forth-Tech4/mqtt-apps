let ws;

const connectBtn = document.querySelector('.connect-btn');
const disconnectBtn = document.querySelector('.disconnect-btn');
const publishBtn = document.querySelector('.publish-btn');
const subscribeBtn = document.querySelector('.subscribe-btn');
const receiverBox = document.getElementById('receiverBox');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');

connectBtn.addEventListener('click', () => {
  const enteredUsername = usernameInput.value;
  const enteredPassword = passwordInput.value;

  if (enteredUsername === 'kanji' && enteredPassword === '123') {
    ws = new WebSocket('ws://localhost:3001');

    ws.onopen = () => {
      console.log('Connected to Node.js WebSocket Server');
      alert('Connected!');
      disconnectBtn.removeAttribute('disabled');
      connectBtn.setAttribute('disabled', true);
      receiverBox.innerHTML = '';
    };

    ws.onmessage = (event) => {
      const { topic, message, error } = JSON.parse(event.data);

      if (error) {
        console.log('Error:', error);
        alert(error);
        ws.close();
        disconnectBtn.setAttribute('disabled', true);
        connectBtn.removeAttribute('disabled');
      } else {
        const msg = document.createElement('p');

        let displayMessage = message;
        try {
          const parsed = JSON.parse(message);
          if (typeof parsed === 'object' && parsed !== null) {
            displayMessage = Object.values(parsed).join(', ');
          }
        } catch (e) {}

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
  } else if (enteredUsername || enteredPassword) {
    alert('Incorrect username or password. Connection not initiated.');
  } else {
    alert('Please enter a username and password.');
  }
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
