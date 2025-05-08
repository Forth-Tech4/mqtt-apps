import React, { useState } from 'react';
import useWebSocket from '../hooks/useWebSocket';
import ConnectionCard from './ConnectionCard';
import ControlsCard from './ControlsCard';
import PublisherCard from './PublisherCard';
import SubscriberCard from './SubscriberCard';
import ReceiverCard from './ReceiverCard';

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
      alert('Please connect to WebSocket first!');
      return;
    }
    if (!topic || topic.trim() === '') {
      alert('Please enter a valid topic to subscribe to!');
      return;
    }
    subscribeTopic(topic);
    alert(`Subscribed to topic: ${topic}`);
  };

  const handlePublish = (topic, payload) => {
    if (!isConnected) {
      alert('Please connect to WebSocket first!');
      return;
    }
    if (!topic || topic.trim() === '' || !payload || payload.trim() === '') {
      alert('Topic and payload must not be empty!');
      return;
    }
    publishMessage(topic, payload);
    alert(`Published to topic: ${topic} with message: ${payload}`);
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
          <div className="grid grid-cols-3 gap-4">
            <button onClick={() => handleDeviceToggle('laser')}>Toggle Laser</button>
            <button onClick={() => handleDeviceToggle('light')}>Toggle Light</button>
            <button onClick={() => handleDeviceToggle('buzzer')}>Toggle Buzzer</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Main;
