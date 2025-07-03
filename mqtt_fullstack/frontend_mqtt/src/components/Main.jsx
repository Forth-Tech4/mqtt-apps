// src/components/Main.jsx
import React, { useState, useCallback, useEffect, useRef } from "react"; // Import useRef
import useWebSocket from "../hooks/useWebSocket";
import ConnectionCard from "./ConnectionCard";
import ControlsCard from "./ControlsCard";
import PublisherCard from "./PublisherCard";
import SubscriberCard from "./SubscriberCard";
import ReceiverCard from "./ReceiverCard";
import "../utils/fontawesome";
import { showToast } from "../utils/ToastComponent";
import SelectDevice from "./Selectdevice";
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Main = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [macAddress, setMacAddress] = useState(
    localStorage.getItem("activeMac") || ""
  );
  // Centralized state for the editable client ID
  const [editableClientId, setEditableClientId] = useState(user?.common_name || "");
  const debounceTimeoutRef = useRef(null); // Ref for debounce timeout

  const [deviceState, setDeviceState] = useState({
    laser: false,
    light: false,
    buzzer: "off",
    water: false,
    pan: 0,
    tilt: 0,
  });

  useEffect(() => {
    // Initialize editableClientId when user data loads, but only if it's not already edited
    if (user && user.common_name && !editableClientId) {
      setEditableClientId(user.common_name);
    } else if (!user) {
      setEditableClientId(""); // Clear on logout
    }
  }, [user]); // Removed editableClientId from dependencies to prevent re-setting if user types

  // Debounce the client ID change notification
  const handleClientIdChange = (newClientId) => {
    setEditableClientId(newClientId);

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      showToast('info', `Client ID updated to: ${newClientId}`);
    }, 1000); // 1 second debounce
  };

  const handleDeviceUpdate = useCallback((peripheral, messagePayload) => {
    setDeviceState((prev) => {
      const newState = { ...prev };
      switch (peripheral) {
        case "pan":
        case "tilt":
          if (messagePayload && typeof messagePayload.value === "number") {
            newState[peripheral] = messagePayload.value;
          }
          break;
        case "buzzer":
          if (messagePayload && typeof messagePayload.mode === "string") {
            newState.buzzer = messagePayload.mode;
          }
          break;
        case "light":
        case "laser":
        case "water":
          if (
            messagePayload &&
            (typeof messagePayload.value === "boolean" ||
              typeof messagePayload.value === "number")
          ) {
            newState[peripheral] = Boolean(messagePayload.value);
          }
          break;
        default:
          console.warn(
            `Unknown or unhandled peripheral in device update: ${peripheral}`,
            messagePayload
          );
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
    connectWebSocket,
    disconnectWebSocket,
    publishRaw,
    publishStructuredCommand,
    subscribeTopic,
    clearMessages,
  } = useWebSocket(handleDeviceUpdate);

  const handleConnect = (host, port, clientIdFromInput) => {
    // Pass the currently edited clientIdInput to connectWebSocket
    connectWebSocket(host, port, clientIdFromInput);
  };

  const handleSubscribe = (topic) => {
    if (!isConnected) {
      showToast("error", "Please connect to WebSocket first!");
      return;
    }
    if (!topic || topic.trim() === "") {
      showToast("error", "Please enter a valid topic to subscribe to!");
      return;
    }
    subscribeTopic(topic);
  };

  const handlePublish = (topic, stringifiedPayload) => {
    if (!isConnected) {
      showToast("error", "Please connect to WebSocket first!");
      return;
    }
    if (
      !topic ||
      topic.trim() === "" ||
      !stringifiedPayload ||
      stringifiedPayload.trim() === ""
    ) {
      showToast("error", "Topic and payload must not be empty!");
      return;
    }
    let parsedPayload;
    try {
      parsedPayload = JSON.parse(stringifiedPayload);
    } catch (e) {
      showToast(
        "error",
        "Payload is not valid JSON. Please provide a JSON string."
      );
      return;
    }
    publishRaw(topic, stringifiedPayload);
    // The peripheral is now inside the message for structured commands,
    // but for raw publishes, it might still be part of the topic if user puts it there.
    // This logic might need refinement depending on expected raw publish formats.
    const peripheral = topic.split('/').pop(); // Assumes last part of topic is peripheral for raw
    if (parsedPayload.peripheral) { // Prefer peripheral from payload if it exists
      handleDeviceUpdate(parsedPayload.peripheral, parsedPayload);
    } else if (peripheral) {
      handleDeviceUpdate(peripheral, parsedPayload);
    }
  };

  const handleStructuredPublish = (peripheral, payload) => {
    if (!isConnected) {
      showToast("error", "Please connect to WebSocket first!");
      return;
    }
    // Pass the current editableClientId to the structured publish function
    publishStructuredCommand(peripheral, payload, macAddress, editableClientId);
    handleDeviceUpdate(peripheral, payload);
  };

  const handleLogout = () => {
    disconnectWebSocket();
    logout();
    navigate('/login');
  };

  return (
    <div className="bg-zinc-800 font-sans p-5 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-5">
          {user && (
            <span className="text-white text-lg font-semibold">
              Logged in as: {user.name} ({user.common_name})
            </span>
          )}
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md shadow-md transition duration-300 ease-in-out"
          >
            Logout
          </button>
        </div>
        <div className="grid grid-cols-1 gap-8">
          <ConnectionCard
            onConnect={handleConnect}
            onDisconnect={disconnectWebSocket}
            clientIdInput={editableClientId} // Pass current value
            setClientIdInput={handleClientIdChange} // Pass the debounced handler
          />
          <SelectDevice onMacChange={setMacAddress} />
          <ControlsCard
            onPublish={handleStructuredPublish}
            clientId={editableClientId} // Use editableClientId
            deviceState={deviceState}
            activeMac={macAddress}
            setMacAddress={setMacAddress}
          />
          <PublisherCard
            onPublish={handlePublish}
            isConnected={isConnected}
            clientId={editableClientId} // Use editableClientId
          />
          <SubscriberCard
            onSubscribe={handleSubscribe}
            clientId={editableClientId} // Use editableClientId
          />
          <ReceiverCard
            messages={messages}
            clientId={editableClientId} // Use editableClientId
            onClear={clearMessages}
          />
        </div>
      </div>
    </div>
  );
};
export default Main;
