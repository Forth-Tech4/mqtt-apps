let ws;

const connectBtn = document.querySelector('.connect-btn');
const disconnectBtn = document.querySelector('.disconnect-btn');
const publishBtn = document.querySelector('.publish-btn');
const subscribeBtn = document.querySelector('.subscribe-btn');
const receiverBox = document.getElementById('receiverBox');

connectBtn.addEventListener('click', () => {
    ws = new WebSocket('ws://localhost:3000');

    ws.onopen = () => {
        console.log('Connected to Node.js WebSocket Server');
        alert('Connected!');
        receiverBox.innerHTML = '';
    };

    ws.onmessage = (event) => {
        const { topic, message } = JSON.parse(event.data);
        const msg = document.createElement('p');
        msg.textContent = `Topic: ${topic} | Message: ${message}`;
        receiverBox.appendChild(msg);
        receiverBox.scrollTop = receiverBox.scrollHeight;
    };

    ws.onclose = () => {
        console.log('WebSocket disconnected');
        alert('Disconnected!');
        receiverBox.innerHTML = '';
    };
});

disconnectBtn.addEventListener('click', () => {
    if (ws) {
        ws.close();
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
