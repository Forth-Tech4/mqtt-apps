import React, { useState, useCallback } from "react";
import useWebSocket from "../hooks/useWebSocket";
import ConnectionCard from "./ConnectionCard";
import ControlsCard from "./ControlsCard";
import PublisherCard from "./PublisherCard";
import SubscriberCard from "./SubscriberCard";
import ReceiverCard from "./ReceiverCard";
import "../utils/fontawesome";
import { showToast } from "../utils/ToastComponent";
import SelectDevice from "./Selectdevice";

const Main = () => {
  const [macAddress, setMacAddress] = useState(localStorage.getItem("activeMac") || "");
  const [userClientId, setUserClientId] = useState("");
  const [deviceState, setDeviceState] = useState({
    laser: false,
    light: false,
    buzzer: "off",
    water: false,
    pan: 0,
    tilt: 0,
  });

  const handleDeviceUpdate = useCallback((feature, messagePayload) => {
    setDeviceState((prev) => {
      const newState = { ...prev };
      switch (feature) {
        case "pan":
        case "tilt":
          if (typeof messagePayload.value === "number") newState[feature] = messagePayload.value;
          break;
        case "buzzer":
          if (typeof messagePayload.mode === "string") newState.buzzer = messagePayload.mode;
          break;
        case "light":
        case "laser":
        case "water":
          if (typeof messagePayload.value === "boolean" || typeof messagePayload.value === "number") {
            newState[feature] = Boolean(messagePayload.value);
          }
          break;
        case "softwareupdate":
          console.log("📦 Software update acknowledged.");
          break;

        default:
          console.warn(`Unhandled feature: ${feature}`);
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
    publishCommand,
    subscribeTopic,
    clearMessages,
    isReconnecting,
    isManuallyDisconnected,
  } = useWebSocket(handleDeviceUpdate, userClientId);

  const handleConnect = (host, port, clientIdFromInput) => {
    connectWebSocket(host, port, clientIdFromInput);
    setUserClientId(clientIdFromInput);
  };

  const handleSubscribe = async (topic) => {
    if (isManuallyDisconnected) {
      showToast("error", "You manually disconnected. Please connect manually first!");
      return;
    }

    if (!isConnected) {
      showToast("info", "Not connected. Attempting to reconnect...");
    }

    if (!topic.trim()) {
      showToast("error", "Please enter a valid topic to subscribe to!");
      return;
    }

    await subscribeTopic(topic);
  };

  const handlePublish = async (topic, stringifiedPayload) => {
    if (isManuallyDisconnected) {
      showToast("error", "You manually disconnected. Please connect manually first!");
      return;
    }

    if (!isConnected) {
      showToast("info", "Not connected. Attempting to reconnect...");
    }

    if (!topic.trim() || !stringifiedPayload.trim()) {
      showToast("error", "Topic and payload must not be empty!");
      return;
    }

    let parsedPayload;
    try {
      parsedPayload = JSON.parse(stringifiedPayload);
    } catch {
      showToast("error", "Payload is not valid JSON.");
      return;
    }

    const feature = topic.split("/")[1] + topic.split("/")[2] || "non-found";

    // Wait for potential reconnection before updating device state
    await publishCommand(feature, parsedPayload);

    // Only update device state if still connected after publish attempt
    if (isConnected) {
      handleDeviceUpdate(feature, parsedPayload);
    }
  };

  const handleStructuredPublish = async (feature, payload, mac = "") => {
    if (isManuallyDisconnected) {
      showToast("error", "You manually disconnected. Please connect manually first!");
      return;
    }

    if (!isConnected) {
      showToast("info", "Not connected. Attempting to reconnect...");
    }

    const targetTopic = mac ? `Forthtech/${mac}` : `Forthtech`;

    // Wait for potential reconnection before updating device state
    await publishCommand(feature, payload, targetTopic);

    // Only update device state if still connected after publish attempt
    if (isConnected) {
      handleDeviceUpdate(feature, payload);
    }
  };

  // Connection status indicator
  const getConnectionStatus = () => {
    if (isReconnecting) return "Reconnecting...";
    if (isManuallyDisconnected) return "Manually Disconnected";
    if (isConnected) return "Connected";
    return "Disconnected";
  };

  const getConnectionStatusColor = () => {
    if (isReconnecting) return "text-yellow-400";
    if (isManuallyDisconnected) return "text-red-400";
    if (isConnected) return "text-green-400";
    return "text-gray-400";
  };

  return (
    <div className="bg-zinc-800 font-sans p-5 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Connection Status Banner */}
        <div className="mb-4 p-3 bg-zinc-700 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : isReconnecting ? 'bg-yellow-400' : 'bg-red-400'}`}></div>
              <span className={`font-medium ${getConnectionStatusColor()}`}>
                {getConnectionStatus()}
              </span>
            </div>
            {isReconnecting && (
              <div className="text-sm text-gray-400">
                Auto-reconnecting on user action...
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <ConnectionCard
            onConnect={handleConnect}
            onDisconnect={disconnectWebSocket}
            setClientId={setUserClientId}
            isReconnecting={isReconnecting}
            isManuallyDisconnected={isManuallyDisconnected}
          />
          <SelectDevice onMacChange={setMacAddress} />
          <ControlsCard
            onPublish={handleStructuredPublish}
            clientId={userClientId}
            deviceState={deviceState}
            activeMac={macAddress}
            setMacAddress={setMacAddress}
            isReconnecting={isReconnecting}
            isManuallyDisconnected={isManuallyDisconnected}
          />
          <PublisherCard
            onPublish={handlePublish}
            isConnected={isConnected}
            clientId={userClientId}
            isReconnecting={isReconnecting}
            isManuallyDisconnected={isManuallyDisconnected}
          />
          <SubscriberCard
            onSubscribe={handleSubscribe}
            clientId={userClientId}
            isReconnecting={isReconnecting}
            isManuallyDisconnected={isManuallyDisconnected}
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