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
  const [macAddress, setMacAddress] = useState(
    localStorage.getItem("activeMac") || ""
  );
  const [userClientId, setUserClientId] = useState("");
  const [deviceState, setDeviceState] = useState({
    laser: false,
    light: false,
    buzzer: "off",
    water: false,
    pan: 0,
    tilt: 0,
  });
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
        case "light": // Renamed from 'led'
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
    publishCommand,
    subscribeTopic,
    clearMessages,
  } = useWebSocket(handleDeviceUpdate);
  const handleConnect = (host, port, clientIdFromInput) => {
    connectWebSocket(host, port, clientIdFromInput);
    setUserClientId(clientIdFromInput); // Store the client ID for later use
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
    console.log("topic---------->", topic);
    console.log("stringifiedPayload---------->", stringifiedPayload);
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
    // Attempt to parse the stringifiedPayload to validate it before sending
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
    const peripheral = topic.split("/")[1] + topic.split("/")[2] || "non-found";
    publishCommand(peripheral, parsedPayload, macAddress);
    handleDeviceUpdate(peripheral, parsedPayload);
  };
  const handleStructuredPublish = (peripheral, payload, mac = "") => {
    if (!isConnected) {
      showToast("error", "Please connect to WebSocket first!");
      return;
    }
    const targetTopic = mac ? `Forthtech/${mac}` : `Forthtech`; // :white_tick: Handles both specific and "all"
    publishCommand(peripheral, payload, targetTopic);
    handleDeviceUpdate(peripheral, payload);
  };
  return (
    <div className="bg-zinc-800 font-sans p-5 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 gap-8">
          <ConnectionCard
            onConnect={handleConnect}
            onDisconnect={disconnectWebSocket}
            setClientId={setUserClientId}
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