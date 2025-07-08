import { useState, useEffect, useRef, useCallback } from 'react';
import { showToast } from '../utils/ToastComponent';

// Removed PING_INTERVAL as ping logic is removed

function useWebSocket(onDeviceUpdate, currentClientId) { // Accept currentClientId as a prop
  const [ws, setWs] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [subscribedTopics, setSubscribedTopics] = useState([]);
  const subscribedTopicsRef = useRef([]);

  const wsInstanceRef = useRef(null); // Ref to hold the WebSocket instance for cleanup and direct access

  // New state to store connection parameters for on-demand reconnection
  // We will still store clientId here for the purpose of reconnection, but publishCommand will use the prop.
  const [connectionParams, setConnectionParams] = useState(null);

  useEffect(() => {
    subscribedTopicsRef.current = subscribedTopics;
  }, [subscribedTopics]);

  // Function for raw publishing (e.g., from PublisherCard)
  const publishToTopic = async (topic, message) => {
    // If not connected, attempt to reconnect first
    if (!isConnected) {
      showToast('info', 'WebSocket disconnected. Attempting to reconnect...');
      if (!connectionParams) {
        showToast('error', 'Cannot reconnect: Connection parameters not available. Please connect manually first.');
        return;
      }
      try {
        await connectWebSocket(connectionParams.host, connectionParams.port, connectionParams.clientId); // Use stored clientId for reconnection
        if (!wsInstanceRef.current || wsInstanceRef.current.readyState !== WebSocket.OPEN) {
          showToast('error', 'Reconnection failed. Please try again or connect manually.');
          return;
        }
        showToast('success', 'WebSocket reconnected. Sending command...');
      } catch (err) {
        showToast('error', `Reconnection failed: ${err.message}`);
        return;
      }
    }

    try {
      JSON.parse(message); // Just to check if it's valid JSON
      const messageToSend = JSON.stringify({ action: 'publish', topic, message });

      console.log('⬆️ SENT to server (Publish - Raw):', {
        topic,
        message,
      });

      wsInstanceRef.current.send(messageToSend);
      showToast('success', `Published raw message to ${topic}`);

      if (checkIfTopicIsSubscribed(topic)) {
        setMessages(prev => [
          ...prev,
          {
            topic,
            message: JSON.parse(message), // Parse for display in UI
            timestamp: Date.now(),
            local: true,
          },
        ]);
      }
    } catch (err) {
      showToast('error', 'Message must be a valid JSON string.');
      console.error('Invalid JSON for raw message:', err);
    }
  };

  const checkIfTopicIsSubscribed = (topicToCheck) => {
      return subscribedTopicsRef.current.some(subTopic => {
          if (subTopic.endsWith('/#')) {
            const baseTopic = subTopic.slice(0, -2);
            return topicToCheck.startsWith(baseTopic);
          }
          return topicToCheck === subTopic;
      });
  };

  // Make connectWebSocket async and return a Promise
  const connectWebSocket = useCallback((host, port, clientIdToConnect) => { // Renamed param for clarity
    return new Promise((resolve, reject) => {
      // If already connected, disconnect first to ensure a fresh connection
      if (wsInstanceRef.current && wsInstanceRef.current.readyState === WebSocket.OPEN) {
        disconnectWebSocket();
      }

      // Store connection parameters for future on-demand reconnections
      setConnectionParams({ host, port, clientId: clientIdToConnect }); // Store the clientId used for connection

      // Use the VITE_BACKEND_WS_URL from environment variables
      const socket = new WebSocket(`${import.meta.env.VITE_BACKEND_WS_URL}`);
      wsInstanceRef.current = socket; // Store the instance in ref
      setWs(socket); // Also update state for re-renders if needed

      socket.onopen = () => {
        console.log('WebSocket Connected');
        setIsConnected(true);
        showToast('success', 'WebSocket connected successfully');
        resolve(true); // Resolve the promise on successful connection
      };

      socket.onmessage = (event) => {
        try {
          const parsedEventData = JSON.parse(event.data);
          const { action, topic, message } = parsedEventData;

          console.log('⬅️ RECEIVED from server (Message):', { topic, message });

          if (checkIfTopicIsSubscribed(topic)) {
            let parsedMessage = message;

            if (typeof message === 'string') {
              try {
                parsedMessage = JSON.parse(message);
              } catch (err) {
                parsedMessage = message;
              }
            }

            const featureFromMessage = parsedMessage?.feature || parsedMessage?.peripheral;

            let messageAddedOrUpdated = false;
            setMessages(prevMessages => {
              const newMessages = [...prevMessages];
              for (let i = newMessages.length - 1; i >= 0; i--) {
                const existingMsg = newMessages[i];
                const contentMatches =
                  typeof existingMsg.message === 'object' &&
                  typeof parsedMessage === 'object' &&
                  (existingMsg.message.peripheral === parsedMessage.peripheral || existingMsg.message.feature === parsedMessage.feature) &&
                  JSON.stringify(existingMsg.message) === JSON.stringify(parsedMessage);

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

            let statusMessage = '';
            if (typeof parsedMessage === 'object') {
              const receivedFeatureOrPeripheral = parsedMessage.feature || parsedMessage.peripheral;
              switch (receivedFeatureOrPeripheral) {
                case 'pan':
                case 'tilt':
                  if (parsedMessage.value !== undefined) {
                    statusMessage = `${receivedFeatureOrPeripheral.charAt(0).toUpperCase() + receivedFeatureOrPeripheral.slice(1)} set to ${parsedMessage.value}°`;
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
                    statusMessage = `${receivedFeatureOrPeripheral.charAt(0).toUpperCase() + receivedFeatureOrPeripheral.slice(1)} turned ${parsedMessage.value ? 'ON' : 'OFF'}`;
                  }
                  break;
                case 'softwareupate':
                  statusMessage = `Software Update initiated for server: ${parsedMessage.server}`;
                  break;
                default:
                  statusMessage = `Received message for "${receivedFeatureOrPeripheral}": ${JSON.stringify(parsedMessage)}`;
                  break;
              }
            } else if (typeof parsedMessage === 'string') {
              statusMessage = `Received: ${parsedMessage}`;
            }

            if (statusMessage) {
              showToast('success', statusMessage);
            }

            onDeviceUpdate && onDeviceUpdate(featureFromMessage, parsedMessage);
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
        reject(err);
      };

      socket.onclose = () => {
        console.log('WebSocket Disconnected');
        setIsConnected(false);
        setSubscribedTopics([]);
        subscribedTopicsRef.current = [];
        setMessages([]);
        showToast('info', 'Disconnected from WebSocket.');
      };
    });
  }, [onDeviceUpdate]); // Dependencies for useCallback

  const subscribeTopic = (topic) => {
    console.log("📥 Subscribing to topic:", topic);

    if (wsInstanceRef.current?.readyState !== WebSocket.OPEN) {
      showToast('error', 'WebSocket not connected. Please connect first.');
      return;
    }
    console.log('⬆️ SENT to server (Subscribe):', { action: 'subscribe', topic });

    wsInstanceRef.current.send(JSON.stringify({ action: 'subscribe', topic }));
    setSubscribedTopics(prev => [...prev, topic]);
    showToast('info', `Subscribed to topic: ${topic}`);
  };

  // Function for structured commands (e.g., from ControlsCard)
  const publishCommand = async (feature, commandPayload) => {
    // If not connected, attempt to reconnect first
    if (!isConnected) {
      showToast('info', 'WebSocket disconnected. Attempting to reconnect...');
      if (!connectionParams) {
        showToast('error', 'Cannot reconnect: Connection parameters not available. Please connect manually first.');
        return;
      }
      try {
        await connectWebSocket(connectionParams.host, connectionParams.port, connectionParams.clientId); // Use stored clientId for reconnection
        if (!wsInstanceRef.current || wsInstanceRef.current.readyState !== WebSocket.OPEN) {
          showToast('error', 'Reconnection failed. Please try again or connect manually.');
          return;
        }
        showToast('success', 'WebSocket reconnected. Sending command...');
      } catch (err) {
        showToast('error', `Reconnection failed: ${err.message}`);
        return;
      }
    }

    // Use the currentClientId prop directly for topic construction
    const MAC_ADDRESS = localStorage.getItem('activeMac');

    let topic;
    if (MAC_ADDRESS && MAC_ADDRESS.trim() !== '') {
      topic = `${currentClientId}/${MAC_ADDRESS}`;
    } else {
      topic = `${currentClientId}`;
    }

    const message = { feature, ...commandPayload };

    let isValid = true;
    let errorMessage = '';

    switch (feature) {
      case 'pan':
        if (typeof message.value !== 'number' || message.value < -180 || message.value > 360) {
          isValid = false;
          errorMessage = 'Pan value must be a number between -180 and 360.';
        }
        break;
      case 'tilt':
        if (typeof message.value !== 'number' || message.value < -60 || message.value > 90) {
          isValid = false;
          errorMessage = 'Tilt value must be a number between -60 and 90.';
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
          errorMessage = `${feature} value must be 0, 1, true, or false.`;
        } else if (typeof message.value === 'number' && ![0, 1].includes(message.value)) {
          isValid = false;
          errorMessage = `${feature} value must be 0 or 1.`;
        }
        if (typeof message.value === 'boolean') {
          message.value = message.value ? 1 : 0;
        }
        break;
      case 'softwareupate':
        if (!message.server || !message.user || !message.pass || !message.filepath || !message.type) {
          isValid = false;
          errorMessage = 'Software update payload is incomplete. All fields (server, user, pass, filepath, type) are required.';
        }
        break;
      default:
        if (!feature) {
          isValid = false;
          errorMessage = 'Unknown feature.';
        }
    }

    if (!isValid) {
      showToast('error', `Command Rejected: ${errorMessage}`);
      return;
    }

    if (wsInstanceRef.current?.readyState === WebSocket.OPEN) {
      const messageToSend = JSON.stringify({ action: 'publish', topic, message: JSON.stringify(message) });
      console.log('⬆️ SENT to server (Publish Structured):', JSON.parse(messageToSend));
      wsInstanceRef.current.send(messageToSend);
      showToast('success', `Command sent to topic "${topic}" for feature "${feature}"`);

      if (checkIfTopicIsSubscribed(topic)) {
        setMessages(prev => [...prev, {
          topic,
          message, // Use the parsed message object for display
          timestamp: Date.now(),
          local: true
        }]);
      }
    }
  };

  const disconnectWebSocket = useCallback(() => {
    if (wsInstanceRef.current) {
      wsInstanceRef.current.close();
    }
    setIsConnected(false);
    setSubscribedTopics([]);
    subscribedTopicsRef.current = [];
    setMessages([]);
    showToast('info', 'Disconnected from WebSocket.');
  }, []);

  const clearMessages = () => {
    console.log('🗑️ Clearing all messages from state.');
    setMessages([]);
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (wsInstanceRef.current) {
        wsInstanceRef.current.close();
      }
    };
  }, []);

  return {
    ws,
    isConnected,
    messages,
    setMessages,
    connectWebSocket,
    subscribeTopic,
    publishToTopic,
    publishCommand,
    disconnectWebSocket,
    clearMessages,
  };
}

export default useWebSocket;
