const mqtt = require('mqtt');
const fs = require('fs');

let mqttClient = null;
let isMqttConnected = false;
let lastCertError = false;

const DEFAULT_MQTT_SUBSCRIPTION_TOPIC = 'Forthtech/#';

function connectWithCerts({ hostname, port, keyPath, certPath, caPath, clientId }, onConnect, onError, onMessage, ) {
    // If an existing client exists, end it clean before creating a new one
    if (mqttClient) {
        console.log('MQTT: Ending existing MQTT client connection.');
        mqttClient.end(true, () => {
            console.log('MQTT: Existing MQTT client disconnected.');
        });
    }

    const mqttUrl = `mqtts://${hostname}:${port}`;
    console.log(`MQTT: Attempting to connect to ${mqttUrl}`);

    mqttClient = mqtt.connect(mqttUrl, {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
        ca: fs.readFileSync(caPath),
        clientId: `${clientId}`,
        rejectUnauthorized: true,
        reconnectPeriod: 0,
    });

    mqttClient.on('connect', () => {
        isMqttConnected = true;
        lastCertError = false;
        console.log('MQTT: Client connected successfully!');
        if (mqttClient) {
            mqttClient.subscribe(DEFAULT_MQTT_SUBSCRIPTION_TOPIC, (err) => {
                if (err) {
                    console.error(`MQTT: Error subscribing to default topic ${DEFAULT_MQTT_SUBSCRIPTION_TOPIC}:`, err);
                } else {
                    console.log(`MQTT: Successfully subscribed to default topic: ${DEFAULT_MQTT_SUBSCRIPTION_TOPIC}`);
                }
                onConnect();
            });
        } else {
            console.error("MQTT: mqttClient is null on 'connect' event. This should not happen with the fix.");
            onConnect(); 
        }
    });

    mqttClient.on('error', (err) => {
        isMqttConnected = false;
        lastCertError = true;
        console.error('MQTT: Client error:', err.message);
        onError(err);
    });

    mqttClient.on('close', () => {
        isMqttConnected = false;
        console.log('MQTT: Client disconnected.');
    });

    mqttClient.on('reconnect', () => {
        console.log('MQTT: Client attempting to reconnect...');
    });

    mqttClient.on('offline', () => {
        console.log('MQTT: Client is offline.');
    });

    mqttClient.on('message', (topic, message) => {
        console.log(`MQTT: Received message -> Topic: ${topic}, Message: ${message.toString()}`);
        onMessage(topic, message);
    });
}

function publish(topic, message) {
    if (mqttClient && isMqttConnected) {
        mqttClient.publish(topic, message, {}, (err) => {
            if (err) {
                console.error(`MQTT: Failed to publish message to topic ${topic}:`, err);
            } else {
                console.log(`MQTT: Message published to topic: ${topic}`);
            }
        });
    } else {
        console.warn(`MQTT: Cannot publish, client not connected. Topic: ${topic}`);
    }
}

function subscribe(topic) {
    if (mqttClient && isMqttConnected) {
        mqttClient.subscribe(topic, (err) => {
            if (err) {
                console.error(`MQTT: Failed to subscribe to topic ${topic}:`, err);
            } else {
                console.log(`MQTT: Successfully subscribed to topic: ${topic}`);
            }
        });
    } else {
        console.warn(`MQTT: Cannot subscribe, client not connected. Topic: ${topic}`);
    }
}

module.exports = {
    connectWithCerts,
    getClient: () => mqttClient,
    isConnected: () => isMqttConnected,
    hadLastCertError: () => lastCertError,
    publish,
    subscribe,
};