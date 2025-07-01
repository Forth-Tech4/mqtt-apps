import { useState, useEffect, useRef } from 'react';
import { showToast } from '../utils/ToastComponent';

function useWebSocket(onDeviceUpdate) {
  const [ws, setWs] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [clientId, setClientId] = useState('Forthtech');
  const [subscribedTopics, setSubscribedTopics] = useState([]);
  const subscribedTopicsRef = useRef([]);

  useEffect(() => {
    subscribedTopicsRef.current = subscribedTopics;
  }, [subscribedTopics]);

  const publishToTopic = (topic, message) => {
    if (!isConnected) {
      showToast('error', 'WebSocket not connected. Cannot publish message.');
      return;
    }

    console.log(topic, "dsfaaaaaa")

    try {
      const parsedMessage = JSON.parse(message);
      const messageToSend = JSON.stringify({ action: 'publish', topic, message });

      console.log('⬆️ SENT to server (Publish - Manual):', {
        topic,
        parsedMessage,
      });

      ws.send(messageToSend);

      if (checkIfTopicIsSubscribed(topic)) {
        setMessages(prev => [
          ...prev,
          {
            topic,
            message: parsedMessage,
            timestamp: Date.now(),
            local: true,
          },
        ]);
      }

      showToast('success', `Published to ${topic}`);
    } catch (err) {
      showToast('error', 'Message must be a valid JSON string.');
      console.error('Invalid JSON for message:', err);
    }
  };

  useEffect(() => {
    subscribedTopicsRef.current = subscribedTopics;
  }, [subscribedTopics]);

  const checkIfTopicIsSubscribed = (topicToCheck) => {
      return subscribedTopicsRef.current.some(subTopic => {
          if (subTopic.endsWith('/#')) {
              const baseTopic = subTopic.slice(0, -2);
              return topicToCheck.startsWith(baseTopic);
          }
          return topicToCheck === subTopic;
      });
  };


  const connectWebSocket = (host, port, clientIdInput) => {
    setClientId(clientIdInput);
  
    // const socket = new WebSocket(`wss://${import.meta.env.VITE_FRONTEND_URL}`);       // for live production
    const socket = new WebSocket(`ws://${import.meta.env.VITE_FRONTEND_URL}`);           // local development

    socket.onopen = () => {
      console.log('WebSocket Connected');
      setIsConnected(true);
      showToast('success', 'WebSocket connected successfully');
    };

    socket.onmessage = (event) => {
      try {
        const { topic, message } = JSON.parse(event.data);
        console.log('⬅️ RECEIVED from server:', { topic, message });

        if (checkIfTopicIsSubscribed(topic)) {
          let parsedMessage = message;

          if (typeof message === 'string') {
            try {
              parsedMessage = JSON.parse(message);
            } catch (err) {}
          }

          const peripheralFromMessage = parsedMessage?.peripheral;

          let messageAddedOrUpdated = false;
          setMessages(prevMessages => {
            const newMessages = [...prevMessages];
            for (let i = newMessages.length - 1; i >= 0; i--) {
              const existingMsg = newMessages[i];
              const contentMatches =
                typeof existingMsg.message === 'object' &&
                typeof parsedMessage === 'object' &&
                existingMsg.message.peripheral === parsedMessage.peripheral &&
                ((existingMsg.message.value !== undefined &&
                  existingMsg.message.value === parsedMessage.value) ||
                  (existingMsg.message.mode !== undefined &&
                    existingMsg.message.mode === parsedMessage.mode));

              if (existingMsg.local && existingMsg.topic === topic && contentMatches) {
                newMessages[i] = {
                  ...existingMsg,
                  local: false,
                  timestamp: Date.now(),
                };
                console.log('🔄 Updated local message to server-confirmed:', newMessages[i]);
                messageAddedOrUpdated = true;
                break;
              }
            }

            if (!messageAddedOrUpdated) {
              const newMessage = {
                topic,
                message: parsedMessage,
                timestamp: Date.now(),
                local: false,
              };
              console.log('✅ Adding NEW SERVER message to state:', newMessage);
              newMessages.push(newMessage);
              messageAddedOrUpdated = true;
            }
            return newMessages;
          });

          console.log("📤 Publishing to topic:", topic);

          let statusMessage = '';
          if (typeof parsedMessage === 'object' && parsedMessage.peripheral) {
            const receivedPeripheral = parsedMessage.peripheral;
            switch (receivedPeripheral) {
              case 'pan':
              case 'tilt':
                if (parsedMessage.value !== undefined) {
                  statusMessage = `${receivedPeripheral.charAt(0).toUpperCase() + receivedPeripheral.slice(1)} set to ${parsedMessage.value}°`;
                }
                break;
              case 'buzzer':
                if (parsedMessage.mode) {
                  statusMessage = `Buzzer mode set to: ${parsedMessage.mode}`;
                }
                break;
              case 'light':
              case 'laser':
              case 'water':
                if (parsedMessage.value !== undefined) {
                  statusMessage = `${receivedPeripheral.charAt(0).toUpperCase() + receivedPeripheral.slice(1)} turned ${parsedMessage.value ? 'ON' : 'OFF'}`;
                }
                break;
              default:
                statusMessage = `Received message for "${receivedPeripheral}": ${JSON.stringify(parsedMessage)}`;
                break;
            }
          }

          if (statusMessage) {
            showToast('success', statusMessage);
          }

          onDeviceUpdate && onDeviceUpdate(peripheralFromMessage, parsedMessage);
        } else {
          console.log(`Received message for unsubscribed topic: ${topic} (will not be displayed in UI)`);
        }

      } catch (error) {
        console.error("❌ Failed to parse WebSocket message:", error);
        showToast('error', `Failed to parse incoming message: ${error.message}`);
      }
    };

    socket.onerror = (err) => {
      console.error('WebSocket Error:', err);
      showToast('error', 'WebSocket error');
    };

    socket.onclose = () => {
      console.log('WebSocket Disconnected');
      setIsConnected(false);
      setSubscribedTopics([]);
      subscribedTopicsRef.current = [];
      setMessages([]);
      showToast('info', 'Disconnected from WebSocket.');
    };

    setWs(socket);
  };

  const subscribeTopic = (topic) => {
    console.log("📥 Subscribing to topic:", topic);

    if (ws?.readyState !== WebSocket.OPEN) {
      showToast('error', 'WebSocket not connected. Please connect first.');
      return;
    }
    console.log('⬆️ SENT to server (Subscribe):', { action: 'subscribe', topic });

    ws.send(JSON.stringify({ action: 'subscribe', topic }));
    setSubscribedTopics(prev => [...prev, topic]);
    showToast('info', `Subscribed to topic: ${topic}`);
  };

  const publishCommand = (peripheral, commandPayload) => {
  if (!isConnected) {
    showToast('error', 'WebSocket not connected. Cannot send command.');
    return;
  }

  const MAC_ADDRESS = localStorage.getItem('activeMac');
  let topic = '';

  // Check if 'peripheral' ends with 'web' and handle it
  if (peripheral.endsWith('web')) {
    const trimmedPeripheral = peripheral.slice(0, -3).replace(/\/+$/, ''); 
    topic = `${clientId}/${trimmedPeripheral}`;
  } else {
    topic = MAC_ADDRESS ? `${clientId}/${MAC_ADDRESS}` : `${clientId}`;
  
  }

  const message = { peripheral, ...commandPayload };

  let isValid = true;
  let errorMessage = '';

    switch (peripheral) {
      case 'pan':
        if (typeof message.value !== 'number' || message.value < 0 || message.value > 360) {
          isValid = false;
          errorMessage = 'Pan value must be a number between 0 and 360.';
        }
        break;
      case 'tilt':
        if (typeof message.value !== 'number' || message.value < -90 || message.value > 90) {
          isValid = false;
          errorMessage = 'Tilt value must be a number between -90 and 90.';
        }
        break;
      case 'buzzer':
        const validModes = ['alert', 'warning', 'notification', 'off'];
        if (!message.mode || !validModes.includes(message.mode)) {
          isValid = false;
          errorMessage = `Buzzer mode must be one of: ${validModes.join(', ')}.`;
        }
        break;
      case 'light':
      case 'laser':
      case 'water':
        if (message.value === undefined || !(typeof message.value === 'number' || typeof message.value === 'boolean')) {
          isValid = false;
          errorMessage = `${peripheral} value must be 0, 1, true, or false.`;
        } else if (typeof message.value === 'number' && ![0, 1].includes(message.value)) {
          isValid = false;
          errorMessage = `${peripheral} value must be 0 or 1.`;
        }
       if (typeof message.value === 'boolean') {
  message.value = message.value ? 1 : 0;
}
        break;
      default:
        if (!peripheral) {
          isValid = false;
          errorMessage = 'Unknown peripheral.';
        }
    }

    if (!isValid) {
      showToast('error', `Command Rejected: ${errorMessage}`);
      return;
    }

    if (ws?.readyState === WebSocket.OPEN) {
      const messageToSend = JSON.stringify({ action: 'publish', topic, message: JSON.stringify(message) });
      console.log('⬆️ SENT to server (Publish):', JSON.parse(messageToSend));
      ws.send(messageToSend);
      showToast('success', `Command sent to ${peripheral}: ${JSON.stringify(commandPayload)}`);

      if (checkIfTopicIsSubscribed(topic)) {
        setMessages(prev => [...prev, {
          topic,
          message,
          timestamp: Date.now(),
          local: true
        }]);
      }
    }
  };

  const disconnectWebSocket = () => {
    ws?.close();
    setIsConnected(false);
    setSubscribedTopics([]);
    subscribedTopicsRef.current = [];
    setMessages([]);
  };

  const clearMessages = () => {
    console.log('🗑️ Clearing all messages from state.');
    setMessages([]);
  };

  useEffect(() => () => ws?.close(), [ws]);

  return {
    ws,
    isConnected,
    clientId,
    messages,
    setMessages,
    connectWebSocket,
    subscribeTopic,
    publishCommand,
    publishToTopic,
    disconnectWebSocket,
    clearMessages,
  };
}

export default useWebSocket;