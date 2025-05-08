import React, { useEffect, useRef } from 'react';

function ReceiverCard({ messages }) {
  const receiverRef = useRef(null);

  // Optional: Scroll to bottom when messages update
  useEffect(() => {
    if (receiverRef.current) {
      receiverRef.current.scrollTop = receiverRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="bg-white p-5 rounded-md shadow-md mb-8">
      <h2 className="mt-0 mb-5 text-xl text-gray-800">Receiver</h2>
      <div
        id="receiverBox"
        ref={receiverRef}
        className="bg-gray-100 border border-gray-300 rounded-md p-4 text-sm whitespace-pre-wrap h-[200px] overflow-y-auto text-gray-800"
      >
        {messages.length === 0 ? (
          <p className="text-gray-500">No messages received yet.</p>
        ) : (
          <ul>
            {messages.map((msg, index) => (
              <li
                key={`${msg.topic}-${index}`}
                className="bg-zinc-200 rounded p-2 mb-1 animate-fade-in"
              >
                <strong>Topic:</strong> {msg.topic} | <strong>Message:</strong> {msg.message}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default ReceiverCard;
