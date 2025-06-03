import { useState, useEffect, useRef } from 'react';
import { showToast } from '../utils/ToastComponent';

function useWebSocket(onDeviceUpdate) {
  const [ws, setWs] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  // Hardcode clientId here
  const [clientId, setClientId] = useState('Forthtech');
  const [subscribedTopics, setSubscribedTopics] = useState([]);
  const subscribedTopicsRef = useRef([]);

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

  // Remove the `username` parameter as it's no longer needed
  const connectWebSocket = (host, port) => {
    // Client ID is now hardcoded to 'Forthtech'
    setClientId('Forthtech'); 
      //  const socket = new WebSocket(`wss://mqtt-apps-html-to-react-1-testing.onrender.com/`); // Assuming your backend handles the connection with the hardcoded client ID
       const socket = new WebSocket(`ws://localhost:3001`); // Assuming your backend handles the connection with the hardcoded client ID

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
            const parts = topic.split('/');
            const peripheralFromTopic = parts[parts.length - 1] || 'Unknown'; 
            let parsedMessage = message;

            if (typeof message === 'string') {
              try {
                parsedMessage = JSON.parse(message);
              } catch (err) {
                // Not a JSON string, keep as is
              }
            }
            
            // --- DE-DUPLICATION LOGIC WITHOUT UUID ---
            let messageAddedOrUpdated = false;
            setMessages(prevMessages => {
                const newMessages = [...prevMessages];
                // Find the *last* local message for this topic that matches the content
                // We iterate backwards to find the most recent one
                for (let i = newMessages.length - 1; i >= 0; i--) {
                    const existingMsg = newMessages[i];

                    // Match by topic, local status, and content (peripheral and its value/mode)
                    const contentMatches = 
                        (typeof existingMsg.message === 'object' && typeof parsedMessage === 'object' &&
                         existingMsg.message.peripheral === parsedMessage.peripheral &&
                         ((existingMsg.message.value !== undefined && existingMsg.message.value === parsedMessage.value) ||
                          (existingMsg.message.mode !== undefined && existingMsg.message.mode === parsedMessage.mode)));
                    
                    if (existingMsg.local && existingMsg.topic === topic && contentMatches) {
                        // Found a matching local message, update it to be server-confirmed
                        newMessages[i] = {
                            ...existingMsg,
                            local: false, // Mark as server-confirmed
                            timestamp: Date.now(), // Update timestamp
                            // You can update the full message payload too if the server
                            // might send a slightly different canonical version
                            // message: parsedMessage 
                        };
                        console.log('🔄 Updated local message to server-confirmed:', newMessages[i]);
                        messageAddedOrUpdated = true;
                        break; // Stop after updating the most recent match
                    }
                }

                if (!messageAddedOrUpdated) {
                    // If no matching local message was found, add it as a new server message
                    const newMessage = {
                        topic,
                        message: parsedMessage,
                        timestamp: Date.now(),
                        local: false // Always mark server-received messages as non-local
                    };
                    console.log('✅ Adding NEW SERVER message to state:', newMessage);
                    newMessages.push(newMessage);
                    messageAddedOrUpdated = true;
                }
                return newMessages;
            });


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
            } else {
                statusMessage = `Received message for "${peripheralFromTopic}": ${JSON.stringify(parsedMessage)}`;
            }
            
            if (statusMessage) {
                showToast('success', statusMessage);
            }

            onDeviceUpdate && onDeviceUpdate(peripheralFromTopic, parsedMessage); 
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
      // setClientId(''); // No need to clear if it's hardcoded
      setSubscribedTopics([]); 
      subscribedTopicsRef.current = [];
      setMessages([]);
      showToast('info', 'Disconnected from WebSocket.');
    };

    setWs(socket);
  };

  const subscribeTopic = (topic) => {
    if (ws?.readyState !== WebSocket.OPEN) { 
      showToast('error', 'WebSocket not connected. Please connect first.');
      return;
    }
    console.log('⬆️ SENT to server (Subscribe):', { action: 'subscribe', topic });

    ws.send(JSON.stringify({ action: 'subscribe', topic }));
    setSubscribedTopics(prev => {
      const next = [...prev, topic];
      return next; 
    });
    showToast('info', `Subscribed to topic: ${topic}`);

    // Optionally clear messages on new subscription (if you want this behavior)
    // setMessages([]); 
  };

  const publishCommand = (peripheral, commandPayload) => {
    if (!isConnected) {
      showToast('error', 'WebSocket not connected. Cannot send command.');
      return;
    }

  

    const topic = `${clientId}/${peripheral}`; // clientId will be 'Forthtech'
    const message = { peripheral, ...commandPayload }; // No messageId needed

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
        const validBuzzerModes = ['alert', 'warning', 'notification', 'off'];
        if (!message.mode || !validBuzzerModes.includes(message.mode)) {
          isValid = false;
          errorMessage = `Buzzer mode must be one of: ${validBuzzerModes.join(', ')}.`;
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
        if (typeof message.value === 'number') {
            message.value = Boolean(message.value);
        }
        break;
      default:
        if(message !== undefined && message !== null) {
          isValid = true;
          break;
        } else {
          isValid = false;
          errorMessage = `Unknown peripheral: ${peripheral}.`;
          break;
        }
    }

    if (!isValid) {
      showToast('error', `Command Rejected: ${errorMessage}`);
      console.error('Invalid command payload:', message);
      return;
    }

    if (ws?.readyState === WebSocket.OPEN) {
      const messageToSend = JSON.stringify({ action: 'publish', topic, message: JSON.stringify(message) });
      
      console.log('⬆️ SENT to server (Publish):', JSON.parse(messageToSend)); 

      ws.send(messageToSend);
      showToast('success', `Command sent to ${peripheral}: ${JSON.stringify(commandPayload)}`);
      
      // Add local message if the topic is subscribed
      if (checkIfTopicIsSubscribed(topic)) {
        setMessages(prev => {
            const newMessage = {
                topic,
                message: message, 
                timestamp: Date.now(),
                local: true, // Marked as local
            };
            console.log('✅ Adding LOCAL message to state:', newMessage);
            return [...prev, newMessage];
        });
      } else {
        console.log(`Local message for topic ${topic} not added to UI because it's not subscribed.`);
        showToast('info', `Command sent to ${peripheral} (topic not subscribed for local display).`);
      }
    } else {
      showToast('error', 'WebSocket not connected. Cannot send command.');
    }
  };

  const disconnectWebSocket = () => {
    ws?.close();
    setIsConnected(false);
    // setClientId(''); // No need to clear if it's hardcoded
    setSubscribedTopics([]); 
    subscribedTopicsRef.current = [];
    setMessages([]);
    showToast('info', 'Disconnected from WebSocket.');
  };

  const clearMessages = () => {
    console.log('🗑️ Clearing all messages from state.');
    setMessages([]);
  }

  useEffect(() => () => ws?.close(), [ws]);

  return {
    ws,
    isConnected,
    clientId, // clientId will always be 'Forthtech'
    messages,
    setMessages, 
    connectWebSocket,
    subscribeTopic,
    publishCommand, 
    disconnectWebSocket,
    clearMessages,
  };
}

export default useWebSocket;