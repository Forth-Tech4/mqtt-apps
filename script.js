let client;

const connectBtn = document.querySelector('.connect-btn');
const disconnectBtn = document.querySelector('.disconnect-btn');
const publishBtn = document.querySelector('.publish-btn');
const subscribeBtn = document.querySelector('.subscribe-btn');
const receiverBox = document.getElementById('receiverBox');

connectBtn.addEventListener('click', () => {
    const host = document.getElementById('host').value;
    const port = document.getElementById('port').value;
    const clientId = document.getElementById('clientId').value;
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Use ws:// for non-secure WebSocket connections or change to wss:// with correct port.
    const url = host ? `ws://${host}:${port}/mqtt` : `wss://broker.hivemq.com:8884/mqtt`;

    console.log(`Attempting to connect to: ${url}`); // For debugging

    client = mqtt.connect(url, {
        clientId: clientId || `client-${Math.floor(Math.random() * 1000)}`, // Generate a random clientId if not provided
        username: username || undefined,
        password: password || undefined,
        keepalive: 60,
    });

    client.on('connect', () => {
        console.log('Connected to broker');
        alert('Connected to broker!');
    });

    client.on('error', (err) => {
        console.error('Connection error: ', err);
        alert(`Connection error! Check console: ${err}`);
    });

    let messageReceived = false; 

    client.on('message', (topic, message) => {
        if (!messageReceived) {
            receiverBox.innerHTML = ''; 
            messageReceived = true;
        }
        const msg = document.createElement('p');
        msg.textContent = `Topic: ${topic} | Message: ${message}`;
        receiverBox.appendChild(msg);
    });




    client.on('close', () => {
        console.log('Disconnected');
        alert('Disconnected from broker!');
    });

    client.on('reconnect', () => {
        console.log('Attempting to reconnect...');
    });
});

disconnectBtn.addEventListener('click', () => {
    if (client) {
        client.end(true, () => {
            console.log('Connection closed manually.');
        });
    }
});

publishBtn.addEventListener('click', () => {
    const topic = document.getElementById('topic').value;
    const payload = document.getElementById('payload').value;

    if (client && client.connected) {
        client.publish(topic, payload, { qos: 1, retain: false });
        alert('Message Published!');
    } else {
        alert('Please connect first.');
    }
});

subscribeBtn.addEventListener('click', () => {
    const subTopic = document.getElementById('Subscriber').value;

    if (client && client.connected) {
        client.subscribe(subTopic, { qos: 1 }, (err) => {
            if (!err) {
                alert(`Subscribed to ${subTopic}`);
            } else {
                console.error('Subscribe error: ', err);
                alert('Subscribe error! Check console.');
            }
        });
    } else {
        alert('Please connect first.');
    }
});
