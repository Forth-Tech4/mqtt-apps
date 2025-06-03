import React from 'react';

function ReceiverCard({ messages, clientId, onClear }) {
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  // --- REVISED FILTERING LOGIC IN RECEIVER CARD ---
  // We want to display:
  // 1. Any message that is marked as 'local' (meaning, we sent it from this UI)
  // 2. Any message that is NOT 'local' (meaning, it came from the server) AND is for a subscribed topic.
  //    (The 'isSubscribed' check happens in useWebSocket's onmessage, so if it reaches here, it implies it was relevant)
  // The 'local' flag is key here. If you want to hide local messages too when not subscribed,
  // then the 'local' messages shouldn't be added to the 'messages' array in the first place,
  // or they also need a subscription check *before* being added in publishCommand.

  // For your current request: "if I didn't subscribe that topic still I can see that message in my receiver box why?"
  // This implies you want to hide the LOCAL message if the topic isn't subscribed.
  // This means the `setMessages` call in `publishCommand` needs to check subscription.

  // Let's assume the filtering in useWebSocket.js's onmessage is correct.
  // If a message reaches `messages` state with `local: false`, it means it came from a subscribed server topic.
  // If a message reaches `messages` state with `local: true`, it means we just sent it.
  // If you *only* want to show local messages if the corresponding topic is also subscribed
  // (which is a bit redundant if the server echoes them, but good for immediate feedback),
  // then the `publishCommand` itself needs to check.

  // Let's modify `useWebSocket.js` to handle this logic more cleanly.
  // The `ReceiverCard` will then just display everything it receives from `useWebSocket`.
  const displayableMessages = messages;


  return (
    <div className="bg-white p-5 rounded-md shadow-md mb-2">
      <div className="flex justify-between items-center mb-5">
        <h2 className="mt-0 text-2xl font-semibold text-gray-800">Receiver</h2>
        {displayableMessages.length > 0 && (
          <button
            onClick={onClear}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm"
          >
            Clear Messages
          </button>
        )}
      </div>

      {clientId ? (
        <>
          <div className="mb-2 text-sm text-gray-600">
            Showing messages for topics: <span className="font-mono bg-gray-100 px-1 rounded">{clientId}/#</span>
          </div>

          {displayableMessages.length === 0 ? (
            <div className="p-4 border rounded bg-gray-50 text-gray-600">
              No messages yet. Subscribe to a topic and wait for messages.
            </div>
          ) : (
            <div className="border rounded max-h-96 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Topic</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {[...displayableMessages].reverse().map((msg, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        {formatTimestamp(msg.timestamp)}
                        {msg.local && (
                          <span className="ml-2 text-green-600 text-xs">(local)</span>
                        )}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {msg.topic}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500 break-words">
                        <pre className="whitespace-pre-wrap font-mono bg-gray-50 p-2 rounded">
                          {typeof msg.message === 'object'
                            ? JSON.stringify(msg.message, null, 2)
                            : msg.message}
                        </pre>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4">
          <p>Please connect first to receive messages.</p>
        </div>
      )}
    </div>
  );
}

export default ReceiverCard;