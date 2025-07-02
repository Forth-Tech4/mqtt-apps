import React, { useState } from "react";
import { showToast } from "../utils/ToastComponent";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleDown, faAngleUp } from "@fortawesome/free-solid-svg-icons";

function PublisherCard({ onPublish, isConnected, clientId }) {
  const [topicSuffix, setTopicSuffix] = useState("");
  const [message, setMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const toggleAccordion = () => setIsOpen(!isOpen);

  const handlePublish = () => {
    if (!isConnected) {
      showToast("error", "Please connect first.");
      return;
    }
    if (!clientId) {
      showToast("error", "Client ID not available. Please connect first.");
      return;
    }
    if (!message.trim()) {
      showToast("error", "Please enter a message.");
      return;
    }

    // Removed 'sender' and its usage to remove '/web'
    const trimmedSuffix = topicSuffix.trim().replace(/^\/+|\/+$/g, "");
    const topicMiddle = trimmedSuffix ? `/${trimmedSuffix}` : "";
    
    // Construct the full topic without '/web'
    const fullTopic = `${clientId}${topicMiddle}`;

    // Validation to match clientId/
    if (!fullTopic.startsWith(`${clientId}`)) { // Adjusted validation slightly
      showToast(
        "error",
        `You can only publish to topics starting with '${clientId}'`
      );
      return;
    }

    onPublish(fullTopic, message);
    
    // Simplified the toast message as '/web' is no longer appended
    showToast("success", `Published to topic: ${fullTopic}`);
    setMessage("");
  };

  return (
    <div className="bg-white p-5 rounded-md shadow-md mb-2">
      <div
        className="flex justify-between items-center cursor-pointer"
        onClick={toggleAccordion}
      >
        <h2 className="text-2xl font-semibold text-gray-800">Publisher</h2>
        <FontAwesomeIcon icon={isOpen ? faAngleUp : faAngleDown} />
      </div>
      {isOpen && (
        <>
          {!clientId && (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
              <p>Please connect first to publish messages.</p>
            </div>
          )}
          <div className="mb-5">
            <label
              htmlFor="topic"
              className="block text-gray-700 text-sm font-medium mb-1"
            >
              Topic
            </label>
            <div className="flex items-center w-full">
              {clientId && (
                <span className="bg-gray-100 px-3 py-2 border border-r-0 rounded-l text-gray-700 whitespace-nowrap">
                  {clientId}/
                </span>
              )}
              <input
                type="text"
                id="topic"
                placeholder={!clientId ? "subtopic (e.g. water, led)" : ""}
                className={`w-full py-2 px-3 text-gray-700 border ${
                  clientId ? "border-l-0 rounded-r" : "rounded"
                }`}
                value={topicSuffix}
                onChange={(e) =>
                  setTopicSuffix(e.target.value.replace(/^\/+/, ""))
                }
                disabled={!clientId}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              You can only publish to topics that start with your client ID:{" "}
              <span className="font-mono bg-gray-100 px-1 rounded">{clientId || "Not connected"}/...</span>
            </p>
          </div>
          <div className="mb-5">
            <label
              htmlFor="message"
              className="block text-gray-700 text-sm font-medium mb-1"
            >
              Message
            </label>
            <textarea
              id="message"
              placeholder="Message content (JSON format expected)"
              className="shadow border rounded w-full py-2 px-3 text-gray-700 h-24"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={!clientId}
            ></textarea>
          </div>
          <div className="flex gap-2">
            <button
              className={`${
                isConnected && clientId
                  ? "bg-blue-500 hover:bg-blue-700"
                  : "bg-blue-300 cursor-not-allowed"
              } text-white font-bold py-2 px-4 rounded text-sm`}
              onClick={handlePublish}
              disabled={!isConnected || !clientId}
            >
              Publish
            </button>
          </div>
        </>
      )}
    </div>
  );
}
export default PublisherCard;
