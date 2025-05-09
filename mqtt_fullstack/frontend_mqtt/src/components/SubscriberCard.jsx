import React, { useState } from 'react';

function SubscriberCard({ onSubscribe }) {
  const [topic, setTopic] = useState('');

  const handleClick = () => {
    onSubscribe(topic);
  };

  return (
    <div className="bg-white p-5 rounded-md shadow-md mb-2">
      <h2 className="mt-0 mb-5 text-2xl font-semibold text-gray-800">Subscriber</h2>
      <div className="mb-5">
        <label htmlFor="Subscriber" className="block text-gray-700 text-sm font-medium mb-1">Topic</label>
        <input
          type="text"
          id="Subscriber"
          placeholder="Topic"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm"
          onClick={handleClick}
        >
          Subscribe
        </button>
      </div>
    </div>
  );
}


export default SubscriberCard;
