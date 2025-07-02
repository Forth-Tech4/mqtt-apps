// src/components/Main.jsx
import React, { useState, useCallback, useEffect } from "react";
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
  const [userClientId, setUserClientId] = useState(user?.common_name || "");

  const [deviceState, setDeviceState] = useState({
    laser: false,
    light: false,
    buzzer: "off",
    water: false,
    pan: 0,
    tilt: 0,
  });

  useEffect(() => {
    if (user && user.common_name) {
      setUserClientId(user.common_name);
    } else {
      setUserClientId("");
    }
  }, [user]);

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
    clientId,
    connectWebSocket,
    disconnectWebSocket,
    publishRaw,
    publishStructuredCommand,
    subscribeTopic,
    clearMessages,
  } = useWebSocket(handleDeviceUpdate);

  const handleConnect = (host, port, clientIdFromInput) => {
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
    const peripheral = topic.split('/')[2];
    if (peripheral) {
      handleDeviceUpdate(peripheral, parsedPayload);
    }
  };

  const handleStructuredPublish = (peripheral, payload) => {
    if (!isConnected) {
      showToast("error", "Please connect to WebSocket first!");
      return;
    }
    publishStructuredCommand(peripheral, payload, macAddress);
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
          />
          <SelectDevice onMacChange={setMacAddress} />
          <ControlsCard
            onPublish={handleStructuredPublish}
            clientId={userClientId}
            deviceState={deviceState}
            activeMac={macAddress}
            setMacAddress={setMacAddress}
          />
          <PublisherCard
            onPublish={handlePublish}
            isConnected={isConnected}
            clientId={userClientId}
          />
          <SubscriberCard
            onSubscribe={handleSubscribe}
            clientId={userClientId}
          />
          <ReceiverCard
            messages={messages}
            clientId={userClientId}
            onClear={clearMessages}
          />
        </div>
      </div>
    </div>
  );
};
export default Main;
