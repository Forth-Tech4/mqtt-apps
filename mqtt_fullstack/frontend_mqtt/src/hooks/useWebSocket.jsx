import { useState, useEffect } from 'react';
import { showToast } from '../utils/ToastComponent';

function useWebSocket() {
  const [ws, setWs] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);

  const connectWebSocket = (host, port) => {
    const socket = new WebSocket(`ws://${host}:3001`);

    socket.onopen = () => {
      console.log('WebSocket Connected');
      setIsConnected(true);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const { topic, message, error } = data;
        if (error) {
          console.error(error);
          return;
        }
        setMessages((prevMessages) => [...prevMessages, { topic, message }]);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    socket.onclose = () => {
      console.log('WebSocket Disconnected');
      setIsConnected(false);
      setWs(null); 
      showToast('error' ,'WebSocket disconnected.');
    };

    socket.onerror = (error) => {
      console.error('WebSocket Error:', error);
    };

    setWs(socket);
  };

  const disconnectWebSocket = () => {
    if (ws) {
      ws.close();
    }
  };

  const publishMessage = (topic, message) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ action: 'publish', topic, message }));
    }
  };

  const subscribeTopic = (topic) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ action: 'subscribe', topic }));
    }
  };

  useEffect(() => {
    return () => {
      if (ws) ws.close(); // Clean up WebSocket on component unmount
    };
  }, [ws]);

  return {
    ws,
    isConnected,
    messages,
    connectWebSocket,
    disconnectWebSocket,
    publishMessage,
    subscribeTopic,
  };
}

export default useWebSocket;
