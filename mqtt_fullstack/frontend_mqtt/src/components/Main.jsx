import React, { useState } from 'react';
import useWebSocket from '../hooks/useWebSocket';
import ConnectionCard from './ConnectionCard';
import ControlsCard from './ControlsCard';
import PublisherCard from './PublisherCard';
import SubscriberCard from './SubscriberCard';
import ReceiverCard from './ReceiverCard';
import '../utils/fontawesome';
import { showToast } from '../utils/ToastComponent';

const Main = () => {
  const { ws, isConnected, messages, connectWebSocket, disconnectWebSocket, publishMessage, subscribeTopic } = useWebSocket();

  const [deviceState, setDeviceState] = useState({
    laser: 'OFF',
    light: 'OFF',
    buzzer: 'OFF',
  });

  const handleDeviceToggle = (device) => {
    const newState = deviceState[device] === 'ON' ? 'OFF' : 'ON';
    setDeviceState((prevState) => ({
      ...prevState,
      [device]: newState,
    }));
    publishMessage(`op/${device}`, newState);
    alert(`${device.charAt(0).toUpperCase() + device.slice(1)} is now ${newState}`);
  };

  const handleSubscribe = (topic) => {
    if (!isConnected) {
      showToast('error','Please connect to WebSocket first!');
      return;
    }
    if (!topic || topic.trim() === '') {
      showToast('error', 'Please enter a valid topic to subscribe to!');
      return;
    }
    subscribeTopic(topic);
    showToast("success", `Subscribed to topic: ${topic}`);
  };

  const handlePublish = (topic, payload) => {
    if (!isConnected) {
      showToast('error' ,'Please connect to WebSocket first!');
      return;
    }
    if (!topic || topic.trim() === '' || !payload || payload.trim() === '') {
      showToast('error' ,'Topic and payload must not be empty!');
      return;
    }
    publishMessage(topic, payload);
    showToast('success' ,`Published to topic: ${topic} with message: ${payload}`);
  };

  return (
    <div className="bg-zinc-800 font-sans p-5 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 gap-8">
          <ConnectionCard
            onConnect={connectWebSocket}
            onDisconnect={disconnectWebSocket}
          />
          <ControlsCard onPublish={handlePublish} />
          <PublisherCard onPublish={handlePublish} isConnected={isConnected} />
          <SubscriberCard onSubscribe={handleSubscribe} />
          <ReceiverCard messages={messages} />
        </div>
      </div>
    </div>
  );
};

export default Main;
