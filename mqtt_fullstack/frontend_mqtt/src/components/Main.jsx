import React, { useState, useCallback, useEffect, useRef } from "react";
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

  const [deviceState, setDeviceState] = useState({
    laser: false,
    light: false,
    buzzer: "off",
    water: false,
    pan: 0,
    tilt: 0,
  });

  const [macAddress, setMacAddress] = useState(
    localStorage.getItem("activeMac") || ""
  );
  const [editableClientId, setEditableClientId] = useState(user?.common_name || "");
  const [userAssignedMacs, setUserAssignedMacs] = useState([]);
  const debounceTimeoutRef = useRef(null);

  useEffect(() => {
    if (user) {
      if (!editableClientId) {
        setEditableClientId(user.common_name);
      }
      const fetchedMacs = user.mac_addresses || [];
      setUserAssignedMacs(fetchedMacs);
    } else {
      setEditableClientId("");
      setUserAssignedMacs([]);
    }
  }, [user]);

  const handleClientIdChange = (newClientId) => {
    setEditableClientId(newClientId);

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      showToast('info', `Client ID updated to: ${newClientId}`);
    }, 1000);
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
        // Handle 'softwareupate' feature from the new section
        case "softwareupate":
          console.log("Received software update confirmation:", messagePayload);
          // You might want to update a dedicated state for software update status
          // For now, just log it.
          break;
        default:
          console.log(
            `Unknown peripheral in device update: ${peripheral}`,
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
    publishToTopic,
    publishCommand,
    subscribeTopic,
    clearMessages,
  } = useWebSocket(handleDeviceUpdate, editableClientId); // Pass editableClientId to the hook


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
    publishToTopic(topic, stringifiedPayload);
    const peripheral = topic.split('/').pop();

    try {
      if (parsedPayload.peripheral) {
        handleDeviceUpdate(parsedPayload.peripheral, parsedPayload);
      } else if (peripheral) {
        handleDeviceUpdate(peripheral, parsedPayload);
      }
    } catch (error) {
      console.error("handlePublish: Error calling handleDeviceUpdate:", error);
      showToast("error", "Error processing device update after publish.");
    }
  };

  // This function is passed to ControlsCard as onPublish
  const handleStructuredPublish = (feature, payload) => {
    if (!isConnected) {
      showToast("error", "Please connect to WebSocket first!");
      return;
    }
    // publishCommand now handles clientId and activeMac internally
    publishCommand(feature, payload);

    try {
      handleDeviceUpdate(feature, payload);
    } catch (error) {
      console.error("handleStructuredPublish: Error calling handleDeviceUpdate:", error);
      showToast("error", "Error processing device update after structured publish.");
    }
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
            clientIdInput={editableClientId}
            setClientIdInput={handleClientIdChange}
          />
          <SelectDevice
            onMacChange={setMacAddress}
            initialMacAddresses={userAssignedMacs}
          />
          <ControlsCard
            onPublish={handleStructuredPublish}
            clientId={editableClientId}
            deviceState={deviceState}
            activeMac={macAddress}
            setMacAddress={setMacAddress}
          />
          <PublisherCard
            onPublish={handlePublish}
            isConnected={isConnected}
            clientId={editableClientId}
          />
          <SubscriberCard
            onSubscribe={handleSubscribe}
            clientId={editableClientId}
          />
          <ReceiverCard
            messages={messages}
            clientId={editableClientId}
            onClear={clearMessages}
          />
        </div>
      </div>
    </div>
  );
};
export default Main;
