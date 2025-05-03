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

    if (!enteredUsername || !enteredPassword) {
        alert('Please enter a username and password.');
        return;
    }

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