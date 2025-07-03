import React, { useState } from 'react';
import { showToast } from '../utils/ToastComponent';

function SubscriberCard({ onSubscribe, clientId }) {
  const [topicSuffix, setTopicSuffix] = useState('');

  const handleSubscribe = () => {
    if (!clientId) {
      showToast("error", "Client ID not available. Please connect first.");
      return;
    }

    if (!topicSuffix.trim()) {
      showToast("error", "Please enter a topic to subscribe to.");
      return;
    }
    
    // Construct the full topic with clientId/ prefix for custom subscriptions
    const fullTopic = `${clientId}/${topicSuffix.replace(/^\/+/, '')}`;

    onSubscribe(fullTopic);
    showToast("success", `Subscribed to topic: ${fullTopic}`);

    setTopicSuffix(''); 
  };

  const handleQuickSubscribe = () => {
    if (!clientId) {
      showToast("error", "Client ID not available. Please connect first.");
      return;
    }

    // Removed subscription to Forthtech/# as per request
    // const forthtechWildcardTopic = `Forthtech/#`;
    // onSubscribe(forthtechWildcardTopic);
    // showToast("success", `Subscribed to all Forthtech topics: ${forthtechWildcardTopic}`);

    // Only subscribe to client-specific topics
    const clientWildcardTopic = `${clientId}/#`;
    onSubscribe(clientWildcardTopic);
    showToast("success", `Subscribed to all your client-specific topics: ${clientWildcardTopic}`);

    setTopicSuffix('#'); // Set suffix for display
  };

  return (
    <div className="bg-white p-5 rounded-md shadow-md mb-2">
      <h2 className="mt-0 mb-5 text-2xl font-semibold text-gray-800">Subscriber</h2>

      <div className="mb-5">
        <label htmlFor="Subscriber" className="block text-gray-700 text-sm font-medium mb-1">Topic</label>
        <div className="flex w-full">
          {clientId && (
            <span className="border border-r-0 rounded-l px-3 py-2 bg-gray-100 text-gray-700 whitespace-nowrap">
              {clientId}/
            </span>
          )}
          <input
            type="text"
            id="Subscriber"
            placeholder={!clientId ? "subtopic (e.g. water, led, #)" : ""}
            className={`w-full py-2 px-3 text-gray-700 border ${clientId ? "border-l-0 rounded-r" : "rounded"}`}
            value={topicSuffix}
            onChange={(e) => setTopicSuffix(e.target.value.replace(/^\/+/, ''))}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          You can subscribe to topics under your client ID: <span className="font-mono bg-gray-100 px-1 rounded">{clientId || "Not connected"}/...</span>
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm"
          onClick={handleSubscribe}
          disabled={!clientId}
        >
          Subscribe
        </button>
        <button
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-sm"
          onClick={handleQuickSubscribe}
          disabled={!clientId}
        >
          Subscribe to All Relevant Topics
        </button>
      </div>
    </div>
  );
}

export default SubscriberCard;
