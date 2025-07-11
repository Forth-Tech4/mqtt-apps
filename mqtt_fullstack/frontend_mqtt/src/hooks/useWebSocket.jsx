// ✅ Enhanced useWebSocket.js with perfect auto-reconnect functionality
import { useState, useEffect, useRef } from 'react';
import { showToast } from '../utils/ToastComponent';

function useWebSocket(onDeviceUpdate, userClientId) {
  const [ws, setWs] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [clientId, setClientId] = useState('Forthtech');
  const [subscribedTopics, setSubscribedTopics] = useState([]);
  const subscribedTopicsRef = useRef([]);

  // Connection state management
  const [connectionCredentials, setConnectionCredentials] = useState(null);
  const [isManuallyDisconnected, setIsManuallyDisconnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const autoDisconnectTimerRef = useRef(null);
  const wsRef = useRef(null);
  const isConnectedRef = useRef(false);
  const reconnectPromiseRef = useRef(null);

  useEffect(() => {
    subscribedTopicsRef.current = subscribedTopics;
  }, [subscribedTopics]);

  useEffect(() => {
    wsRef.current = ws;
  }, [ws]);

  useEffect(() => {
    isConnectedRef.current = isConnected;
  }, [isConnected]);

  // Clear auto-disconnect timer
  const clearAutoDisconnectTimer = () => {
    clearTimeout(autoDisconnectTimerRef.current);
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

  // Enhanced auto-reconnect function with proper promise handling
  const attemptReconnect = () => {
    if (!connectionCredentials || isManuallyDisconnected) {
      return Promise.reject(new Error('Cannot reconnect - no credentials or manually disconnected'));
    }

    // If already reconnecting, return the existing promise
    if (reconnectPromiseRef.current) {
      return reconnectPromiseRef.current;
    }

    setIsReconnecting(true);
    showToast('info', 'Attempting to reconnect...');

    reconnectPromiseRef.current = new Promise((resolve, reject) => {
      const { host, port, clientIdInput } = connectionCredentials;
      // const socket = new WebSocket(`ws://${import.meta.env.VITE_FRONTEND_URL}`);
      const socket = new WebSocket(`wss://${import.meta.env.VITE_FRONTEND_URL}`);

      const connectionTimeout = setTimeout(() => {
        socket.close();
        cleanup();
        reject(new Error('Connection timeout'));
      }, 5000);

      const cleanup = () => {
        clearTimeout(connectionTimeout);
        setIsReconnecting(false);
        reconnectPromiseRef.current = null;
      };

      socket.onopen = () => {
        console.log('✅ WebSocket Reconnected Successfully');

        // Update refs immediately for synchronous access
        wsRef.current = socket;
        isConnectedRef.current = true;

        // Update state
        setWs(socket);
        setIsConnected(true);
        setClientId(clientIdInput);

        // Auto-subscribe to default topic
        const defaultTopic = `${clientIdInput}/#`;
        const subscribeMsg = { action: 'subscribe', topic: defaultTopic };
        console.log('⬆️ Auto-subscribing to default topic:', subscribeMsg);
        socket.send(JSON.stringify(subscribeMsg));
        setSubscribedTopics([defaultTopic]);

        showToast('success', 'Reconnected and auto-subscribed to default topic');
        cleanup();
        resolve(socket);
      };

      socket.onmessage = (event) => {
        console.log('⬅️ RECEIVED raw data from server:', event.data);
        try {
          const { topic, message } = JSON.parse(event.data);
          let parsedMessage;
          try {
            parsedMessage = typeof message === 'string' ? JSON.parse(message) : message;
          } catch {
            parsedMessage = message; // fallback to raw string if JSON parsing fails
          }

          const featureFromMessage = parsedMessage?.feature;

          console.log('🧠 Parsed incoming message:', {
            topic,
            feature: featureFromMessage,
            payload: parsedMessage
          });

          if (checkIfTopicIsSubscribed(topic)) {
            let messageAddedOrUpdated = false;
            setMessages(prev => {
              const newMessages = [...prev];
              for (let i = newMessages.length - 1; i >= 0; i--) {
                const existingMsg = newMessages[i];
                const matches =
                  existingMsg.local &&
                  existingMsg.topic === topic &&
                  existingMsg.message?.feature === parsedMessage?.feature &&
                  JSON.stringify(existingMsg.message) === JSON.stringify(parsedMessage);

                if (matches) {
                  console.log('🔄 Updating local message to server-confirmed:', existingMsg);
                  newMessages[i] = { ...existingMsg, local: false, timestamp: Date.now() };
                  messageAddedOrUpdated = true;
                  break;
                }
              }

              if (!messageAddedOrUpdated) {
                const newMsg = { topic, message: parsedMessage, timestamp: Date.now(), local: false };
                console.log('🆕 Adding new server message to state:', newMsg);
                newMessages.push(newMsg);
              }
              return newMessages;
            });

            onDeviceUpdate?.(featureFromMessage, parsedMessage);
          } else {
            console.log(`⚠️ Topic '${topic}' is not subscribed. Ignoring message.`);
          }
        } catch (error) {
          console.error("❌ Failed to parse WebSocket message:", error);
          showToast('error', `Failed to parse incoming message: ${error.message}`);
        }
      };

      socket.onerror = (err) => {
        console.error('❌ WebSocket Reconnection Error:', err);
        cleanup();
        reject(err);
      };

      socket.onclose = () => {
        console.log('⚠️ WebSocket Disconnected during reconnection');
        wsRef.current = null;
        isConnectedRef.current = false;
        setIsConnected(false);
        setSubscribedTopics([]);
        subscribedTopicsRef.current = [];
        clearAutoDisconnectTimer();

        if (!isManuallyDisconnected) {
          showToast('info', 'Connection lost. Will retry on next action.');
        }
      };
    });

    return reconnectPromiseRef.current;
  };

  const publishToTopic = async (topic, message) => {
    // Check if we need to reconnect first
    if (!isConnectedRef.current && !isManuallyDisconnected) {
      console.log('🔄 Not connected, attempting to reconnect...');
      try {
        await attemptReconnect();
        // Small delay to ensure connection is fully ready
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        showToast('error', 'Failed to reconnect. Cannot publish message.');
        return;
      }
    }

    if (!isConnectedRef.current) {
      if (isManuallyDisconnected) {
        showToast('error', 'You manually disconnected. Please connect manually to continue.');
      } else {
        showToast('error', 'WebSocket not connected. Cannot publish message.');
      }
      return;
    }

    // Ensure WebSocket is ready
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      showToast('error', 'WebSocket is not ready. Please try again.');
      return;
    }

    try {
      const parsedMessage = JSON.parse(message);
      const messageToSend = JSON.stringify({ action: 'publish', topic, message });

      console.log('⬆️ SENT to server (Manual Publish):', {
        action: 'publish',
        topic,
        message: parsedMessage
      });

      wsRef.current.send(messageToSend);

      if (checkIfTopicIsSubscribed(topic)) {
        setMessages(prev => [...prev, {
          topic,
          message: parsedMessage,
          timestamp: Date.now(),
          local: true,
        }]);
      }

      showToast('success', `Published to ${topic}`);

    } catch (err) {
      console.error('❌ Failed to stringify or send message:', err);
      showToast('error', 'Message must be a valid JSON string.');
    }
  };

  const connectWebSocket = (host, port, clientIdInput) => {
    // Store connection credentials for auto-reconnect
    setConnectionCredentials({ host, port, clientIdInput });
    setIsManuallyDisconnected(false);
    setClientId(clientIdInput);

    // const socket = new WebSocket(`ws://${import.meta.env.VITE_FRONTEND_URL}`);
    const socket = new WebSocket(`wss://${import.meta.env.VITE_FRONTEND_URL}`);

    socket.onopen = () => {
      console.log('✅ WebSocket Connected');
      wsRef.current = socket;
      isConnectedRef.current = true;
      setIsConnected(true);
      showToast('success', 'WebSocket connected successfully');
    };

    socket.onmessage = (event) => {
      console.log('⬅️ RECEIVED raw data from server:', event.data);
      try {
        const { topic, message } = JSON.parse(event.data);
        let parsedMessage;
        try {
          parsedMessage = typeof message === 'string' ? JSON.parse(message) : message;
        } catch {
          parsedMessage = message; // fallback to raw string if JSON parsing fails
        }

        const featureFromMessage = parsedMessage?.feature;

        console.log('🧠 Parsed incoming message:', {
          topic,
          feature: featureFromMessage,
          payload: parsedMessage
        });

        if (checkIfTopicIsSubscribed(topic)) {
          let messageAddedOrUpdated = false;
          setMessages(prev => {
            const newMessages = [...prev];
            for (let i = newMessages.length - 1; i >= 0; i--) {
              const existingMsg = newMessages[i];
              const matches =
                existingMsg.local &&
                existingMsg.topic === topic &&
                existingMsg.message?.feature === parsedMessage?.feature &&
                JSON.stringify(existingMsg.message) === JSON.stringify(parsedMessage);

              if (matches) {
                console.log('🔄 Updating local message to server-confirmed:', existingMsg);
                newMessages[i] = { ...existingMsg, local: false, timestamp: Date.now() };
                messageAddedOrUpdated = true;
                break;
              }
            }

            if (!messageAddedOrUpdated) {
              const newMsg = { topic, message: parsedMessage, timestamp: Date.now(), local: false };
              console.log('🆕 Adding new server message to state:', newMsg);
              newMessages.push(newMsg);
            }
            return newMessages;
          });

          onDeviceUpdate?.(featureFromMessage, parsedMessage);
        } else {
          console.log(`⚠️ Topic '${topic}' is not subscribed. Ignoring message.`);
        }
      } catch (error) {
        console.error("❌ Failed to parse WebSocket message:", error);
        showToast('error', `Failed to parse incoming message: ${error.message}`);
      }
    };

    socket.onerror = (err) => {
      console.error('❌ WebSocket Error:', err);
      showToast('error', 'WebSocket error');
    };

    socket.onclose = () => {
      console.log('⚠️ WebSocket Disconnected');
      wsRef.current = null;
      isConnectedRef.current = false;
      setIsConnected(false);
      setSubscribedTopics([]);
      subscribedTopicsRef.current = [];
      clearAutoDisconnectTimer();

      if (!isManuallyDisconnected) {
        showToast('info', 'Connection lost. Will auto-reconnect on next action.');
      }
    };

    setWs(socket);
  };

  const subscribeTopic = async (topic) => {
    // Check if we need to reconnect first
    if (!isConnectedRef.current && !isManuallyDisconnected) {
      console.log('🔄 Not connected, attempting to reconnect...');
      try {
        await attemptReconnect();
        // Small delay to ensure connection is fully ready
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        showToast('error', 'Failed to reconnect. Cannot subscribe to topic.');
        return;
      }
    }

    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      if (isManuallyDisconnected) {
        showToast('error', 'You manually disconnected. Please connect manually to continue.');
      } else {
        showToast('error', 'WebSocket not connected. Please connect first.');
      }
      return;
    }

    const msg = { action: 'subscribe', topic };
    console.log('⬆️ SENT to server (Subscribe):', msg);
    wsRef.current.send(JSON.stringify(msg));
    setSubscribedTopics(prev => [...prev, topic]);
    showToast('info', `Subscribed to topic: ${topic}`);

  };

  const publishCommand = async (feature, commandPayload) => {
    // Check if we need to reconnect first
    if (!isConnectedRef.current && !isManuallyDisconnected) {
      console.log('🔄 Not connected, attempting to reconnect...');
      try {
        await attemptReconnect();
        // Small delay to ensure connection is fully ready
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        showToast('error', 'Failed to reconnect. Cannot send command.');
        return;
      }
    }

    if (!isConnectedRef.current) {
      if (isManuallyDisconnected) {
        showToast('error', 'You manually disconnected. Please connect manually to continue.');
      }
      return;
    }

    // Ensure WebSocket is ready
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      showToast('error', 'WebSocket is not ready. Please try again.');
      return;
    }

    const MAC_ADDRESS = localStorage.getItem('activeMac');
    let topic;
    if (MAC_ADDRESS) {
      topic = `${clientId}/${MAC_ADDRESS}`;
    } else {
      topic = `${clientId}`;
    }


    const message = { feature, ...commandPayload };
    const msgToSend = { action: 'publish', topic, message: JSON.stringify(message) };

    console.log('⬆️ SENT to server (Command):', {
      topic,
      feature,
      payload: message
    });

    wsRef.current.send(JSON.stringify(msgToSend));
    showToast('success', `Command sent to ${feature}: ${JSON.stringify(commandPayload)}`);

    if (checkIfTopicIsSubscribed(topic)) {
      setMessages(prev => [...prev, { topic, message, timestamp: Date.now(), local: true }]);
    }
  };

  const publishRawMessage = (topic, messageString) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn("❌ WebSocket not connected. Cannot send message.");
      showToast('error', 'WebSocket not connected. Cannot publish.');
      return;
    }

    wsRef.current.send(JSON.stringify({
      action: "publish",
      topic,
      message: messageString, // ✅ Still raw string
    }));

    console.log('⬆️ SENT to server (Raw Publish):', { topic, message: messageString });
    showToast('success', `Raw message published to ${topic}`);
  };




  const disconnectWebSocket = () => {
    console.log('👋 Disconnecting WebSocket manually.');
    setIsManuallyDisconnected(true);
    clearAutoDisconnectTimer();
    setConnectionCredentials(null);
    reconnectPromiseRef.current = null;
    wsRef.current?.close();
    showToast('info', 'Manually disconnected. Connect manually to continue.');
  };

  const clearMessages = () => {
    console.log('🗑️ Clearing all messages from state.');
    setMessages([]);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAutoDisconnectTimer();
      reconnectPromiseRef.current = null;
      wsRef.current?.close();
    };
  }, []);

  return {
    ws,
    isConnected,
    clientId,
    messages,
    setMessages,
    connectWebSocket,
    subscribeTopic,
    publishCommand,
    publishRawMessage,
    publishToTopic,
    disconnectWebSocket,
    clearMessages,
    isReconnecting,
    isManuallyDisconnected,
  };
}

export default useWebSocket;