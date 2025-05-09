import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { showToast } from '../utils/ToastComponent';

function PublisherCard({ onPublish }) {
  const [topic, setTopic] = useState('');
  const [payload, setPayload] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const toggleAccordion = () => { setIsOpen(!isOpen) };

  const handleClick = () => {
    onPublish(topic, payload);
    setPayload('');
  };

  return (
    <div className="bg-white p-5 rounded-md shadow-md mb-2">

      <div className="flex justify-between cursor-pointer" onClick={toggleAccordion}>

        <h2 className="mb-5 text-2xl font-semibold text-gray-800">Publisher</h2>
        <FontAwesomeIcon
          icon={isOpen ? 'angle-up' : 'angle-down'}
          className="transition-transform duration-300"
        />

      </div>
      
      {isOpen && (<>
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
      </>)}
    </div>
  );
}


export default PublisherCard;
