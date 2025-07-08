import React from 'react';

function ReceiverCard({ messages, clientId, onClear }) {
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };
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