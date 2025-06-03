import React, { useState, useCallback } from 'react'; // Added useCallback
import useWebSocket from '../hooks/useWebSocket';
import ConnectionCard from './ConnectionCard';
import ControlsCard from './ControlsCard';
import PublisherCard from './PublisherCard'; // PublisherCard might need review for its direct topic/payload handling
import SubscriberCard from './SubscriberCard';
import ReceiverCard from './ReceiverCard';
import '../utils/fontawesome'; // Assuming this provides FontAwesome icons
import { showToast } from '../utils/ToastComponent';
import SelectDevice from './Selectdevice';


const Main = () => {

const [macAddress, setMacAddress] = useState(localStorage.getItem('activeMac') || '');




  const [deviceState, setDeviceState] = useState({
    laser: false, // Use boolean for ON/OFF states
    light: false, // Changed 'led' to 'light', use boolean
    buzzer: 'off', // Use string for buzzer modes
    water: false, // Use boolean for ON/OFF states
    pan: 0,
    tilt: 0,
  });

  // Updated handleDeviceUpdate to parse the new incoming JSON messages
  const handleDeviceUpdate = useCallback((peripheral, messagePayload) => {
    setDeviceState(prev => {
      const newState = { ...prev };
      switch (peripheral) {
        case 'pan':
        case 'tilt':
          // Assuming messagePayload for pan/tilt will be { peripheral: "pan", value: X }
          if (messagePayload && typeof messagePayload.value === 'number') {
            newState[peripheral] = messagePayload.value;
          }
          break;
        case 'buzzer':
          // Assuming messagePayload for buzzer will be { peripheral: "buzzer", mode: "alert" }
          if (messagePayload && typeof messagePayload.mode === 'string') {
            newState.buzzer = messagePayload.mode;
          }
          break;
        case 'light': // Renamed from 'led'
        case 'laser':
        case 'water':
          // Assuming messagePayload for light/laser/water will be { peripheral: "light", value: 1/0/true/false }
          if (messagePayload && (typeof messagePayload.value === 'boolean' || typeof messagePayload.value === 'number')) {
            newState[peripheral] = Boolean(messagePayload.value); // Store as boolean
          }
          break;
        default:
          console.warn(`Unknown or unhandled peripheral in device update: ${peripheral}`, messagePayload);
          break;
      }
      return newState;
    });
  }, []);

  const {
    ws,
    isConnected,
    messages,
    setMessages,
    clientId,
    connectWebSocket,
    disconnectWebSocket,
    publishCommand, // Changed from publishMessage to publishCommand
    subscribeTopic,
    clearMessages
  } = useWebSocket(handleDeviceUpdate);

 const handleConnect = (host, port, username) => {
  connectWebSocket(host, port, username);
  
  // Auto-subscribe to the fixed topic after small delay to ensure connection
  // setTimeout(() => {
  //   subscribeTopic('Forthtech/10:10:10:10');
  // }, 500);
};

  const handleSubscribe = (topic) => {
    if (!isConnected) {
      showToast('error', 'Please connect to WebSocket first!');
      return;
    }
    if (!topic || topic.trim() === '') {
      showToast('error', 'Please enter a valid topic to subscribe to!');
      return;
    }
    subscribeTopic(topic);
  };

  // This handlePublish is for generic publishing (e.g., from PublisherCard)
  // It now expects topic and a stringified JSON message.
  const handlePublish = (topic, stringifiedPayload) => {
    if (!isConnected) {
      showToast('error', 'Please connect to WebSocket first!');
      return;
    }
    if (!topic || topic.trim() === '' || !stringifiedPayload || stringifiedPayload.trim() === '') {
      showToast('error', 'Topic and payload must not be empty!');
      return;
    }

    // Attempt to parse the stringifiedPayload to validate it before sending
    let parsedPayload;
    try {
        parsedPayload = JSON.parse(stringifiedPayload);
    } catch (e) {
        showToast('error', 'Payload is not valid JSON. Please provide a JSON string.');
        return;
    }

    // Determine peripheral from parsedPayload or topic
    const peripheral = topic.split('/')[1] || "non-found";

    // This is a bridge function. For structured commands, `publishCommand` is better.
    // However, if PublisherCard needs to send arbitrary JSON, this is how.
    // It calls the `publishCommand` from the hook, which then validates and sends.
    publishCommand(peripheral, parsedPayload,macAddress); 

    // The direct UI update logic here is largely redundant if `onDeviceUpdate`
    // correctly processes messages received from the WebSocket.
    // Keep it if you want immediate UI feedback *before* the roundtrip to the server.
    // Otherwise, remove it and rely solely on `onDeviceUpdate` triggered by `socket.onmessage`.
    // For now, I'll remove the old direct UI update, assuming `onDeviceUpdate` handles it.
  };

  return (
    <div className="bg-zinc-800 font-sans p-5 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 gap-8">
          <ConnectionCard
            onConnect={handleConnect}
            onDisconnect={disconnectWebSocket}
            setClientId={() => {}} // This seems unused or needs clarification
          />
          <SelectDevice onMacChange={setMacAddress} />

          <ControlsCard
            onPublish={publishCommand} // Pass the new publishCommand directly
            clientId={clientId}
            deviceState={deviceState}
            activeMac={macAddress}
          />
          <PublisherCard
            onPublish={handlePublish} // This one remains for generic stringified JSON publishing
            isConnected={isConnected}
            clientId={clientId}
          />
          <SubscriberCard
            onSubscribe={handleSubscribe}
            clientId={clientId}
          />
          <ReceiverCard
            messages={messages}
            clientId={clientId}
            onClear={clearMessages}
          />
        </div>
      </div>
    </div>
  );
};

export default Main;