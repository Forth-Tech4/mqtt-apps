import React, { useState } from 'react';

function PublisherCard({ onPublish }) {
  const [topic, setTopic] = useState('');
  const [payload, setPayload] = useState('');

  const handleClick = () => {
    onPublish(topic, payload);
    setPayload('');
  };

  return (
    <div className="bg-white p-5 rounded-md shadow-md mb-8">
      <h2 className="mt-0 mb-5 text-xl text-gray-800">Publisher</h2>
      <div className="mb-5">
        <label htmlFor="topic" className="block text-gray-700 text-sm font-medium mb-1">Topic</label>
        <input
          type="text"
          id="topic"
          placeholder="Topic"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
      </div>
      <div className="mb-5">
        <label htmlFor="payload" className="block text-gray-700 text-sm font-medium mb-1">Payload</label>
        <textarea
          id="payload"
          placeholder="Payload"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 min-h-[100px]"
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
        />
      </div>
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm"
        onClick={handleClick}
      >
        Publish
      </button>
    </div>
  );
}


export default PublisherCard;
