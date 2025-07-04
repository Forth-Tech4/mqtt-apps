import { useState, useEffect, useRef, useCallback } from 'react';
import { showToast } from '../utils/ToastComponent';

// Heartbeat configuration (client-side only sends pings, no auto-reconnect on pong timeout)
const PING_INTERVAL = 30000; // Send ping every 30 seconds to keep connection alive if active

function useWebSocket(onDeviceUpdate) {
  const [ws, setWs] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [subscribedTopics, setSubscribedTopics] = useState([]);
  const subscribedTopicsRef = useRef([]);

  const pingIntervalIdRef = useRef(null); // Ref to store the interval ID for pings
  const wsInstanceRef = useRef(null); // Ref to hold the WebSocket instance for cleanup and direct access

  // New state to store connection parameters for on-demand reconnection
  const [connectionParams, setConnectionParams] = useState(null);

  useEffect(() => {
    subscribedTopicsRef.current = subscribedTopics;
  }, [subscribedTopics]);

  // Function to start the ping interval
  const startPing = useCallback(() => {
    // Clear any existing ping interval
    if (pingIntervalIdRef.current) {
      clearInterval(pingIntervalIdRef.current);
    }
    // Set a new interval to send pings
    pingIntervalIdRef.current = setInterval(() => {
      if (wsInstanceRef.current && wsInstanceRef.current.readyState === WebSocket.OPEN) {
        console.log('⬆️ SENT to server (Ping)');
        wsInstanceRef.current.send(JSON.stringify({ action: 'ping' }));
      } else {
        // If WebSocket is not open, clear the interval as pings are no longer relevant
        clearInterval(pingIntervalIdRef.current);
        pingIntervalIdRef.current = null;
      }
    }, PING_INTERVAL);
  }, []);

  // Function for raw publishing (e.g., from PublisherCard)
  const publishRaw = async (topic, message) => {
    // If not connected, attempt to reconnect first
    if (!isConnected) {
      showToast('info', 'WebSocket disconnected. Attempting to reconnect...');
      if (!connectionParams) {
        showToast('error', 'Cannot reconnect: Connection parameters not available. Please connect manually first.');
        return;
      }
      try {
        await connectWebSocket(connectionParams.host, connectionParams.port, connectionParams.clientId);
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
  const connectWebSocket = useCallback((host, port, currentClientId) => {
    return new Promise((resolve, reject) => {
      // If already connected, disconnect first to ensure a fresh connection
      if (wsInstanceRef.current && wsInstanceRef.current.readyState === WebSocket.OPEN) {
        disconnectWebSocket(); // This will also clear the ping interval
      }

      // Store connection parameters for future on-demand reconnections
      setConnectionParams({ host, port, clientId: currentClientId });

      const socket = new WebSocket(`${import.meta.env.VITE_BACKEND_WS_URL}`);
      wsInstanceRef.current = socket; // Store the instance in ref
      setWs(socket); // Also update state for re-renders if needed

      socket.onopen = () => {
        console.log('WebSocket Connected');
        setIsConnected(true);
        showToast('success', 'WebSocket connected successfully');
        startPing(); // Start sending pings on successful connection
        resolve(true); // Resolve the promise on successful connection
      };

      socket.onmessage = (event) => {
        try {
          const parsedEventData = JSON.parse(event.data);
          const { action, topic, message } = parsedEventData;

          // Handle pong message
          if (action === 'pong') {
            console.log('⬅️ RECEIVED from server (Pong)');
            // No need to restart ping here, setInterval handles it
            return; // Don't process pong as a regular message
          }

          console.log('⬅️ RECEIVED from server (Message):', { topic, message });

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
        reject(err); // Reject the promise on connection error
      };

      socket.onclose = () => {
        console.log('WebSocket Disconnected');
        setIsConnected(false);
        setSubscribedTopics([]);
        subscribedTopicsRef.current = [];
        setMessages([]);
        if (pingIntervalIdRef.current) {
          clearInterval(pingIntervalIdRef.current); // Clear ping interval on close
          pingIntervalIdRef.current = null;
        }
        showToast('info', 'Disconnected from WebSocket.');
        // No reject here, as close can be a normal event (e.g., manual disconnect)
      };
    });
  }, [startPing, onDeviceUpdate]); // Dependencies for useCallback

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
  const publishStructuredCommand = async (peripheral, commandPayload, macAddress, currentClientId) => {
    // If not connected, attempt to reconnect first
    if (!isConnected) {
      showToast('info', 'WebSocket disconnected. Attempting to reconnect...');
      if (!connectionParams) {
        showToast('error', 'Cannot reconnect: Connection parameters not available. Please connect manually first.');
        return;
      }
      try {
        await connectWebSocket(connectionParams.host, connectionParams.port, connectionParams.clientId);
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

    let topic;
    if (macAddress && macAddress.trim() !== '') {
      // If MAC address is selected, topic is {clientId}/{MAC_ADDRESS}
      topic = `${currentClientId}/${macAddress}`;
    } else {
      // If no MAC address is selected, topic is {clientId}
      topic = `${currentClientId}`;
    }

    // The message payload will contain the peripheral and its command
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

    if (wsInstanceRef.current?.readyState === WebSocket.OPEN) {
      const messageToSend = JSON.stringify({ action: 'publish', topic, message: JSON.stringify(message) });
      console.log('⬆️ SENT to server (Publish Structured):', JSON.parse(messageToSend));
      wsInstanceRef.current.send(messageToSend);
      showToast('success', `Command sent to topic "${topic}" for peripheral "${peripheral}"`);

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
    if (pingIntervalIdRef.current) {
      clearInterval(pingIntervalIdRef.current);
      pingIntervalIdRef.current = null;
    }
    // showToast('info', 'Disconnected from WebSocket.'); // Removed to avoid double toast on auto-disconnect
  }, []); // No dependencies for useCallback, as it only uses refs

  const clearMessages = () => {
    console.log('🗑️ Clearing all messages from state.');
    setMessages([]);
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (pingIntervalIdRef.current) {
        clearInterval(pingIntervalIdRef.current);
      }
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
    publishRaw,
    publishStructuredCommand,
    disconnectWebSocket,
    clearMessages,
  };
}

export default useWebSocket;
