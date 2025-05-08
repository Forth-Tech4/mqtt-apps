import React, { useState } from 'react';

// Constants for MQTT topics
const TOPICS = {
  MOVE_X: 'op/move/x',
  MOVE_Y: 'op/move/y',
  LASER: 'op/laser',
  LIGHT: 'op/light',
  BUZZER: 'op/buzzer',
};

function ControlsCard({ onPublish }) {
  const [moveX, setMoveX] = useState('');
  const [moveY, setMoveY] = useState('');
  const [laserState, setLaserState] = useState('OFF');
  const [lightState, setLightState] = useState('OFF');
  const [buzzerState, setBuzzerState] = useState('OFF');

  // Handlers
  const handleMoveX = () => {
    if (!moveX || isNaN(moveX)) {
      alert('Enter a valid X coordinate.');
      return;
    }
    onPublish(TOPICS.MOVE_X, moveX);
  };

  const handleMoveY = () => {
    if (!moveY || isNaN(moveY)) {
      alert('Enter a valid Y coordinate.');
      return;
    }
    onPublish(TOPICS.MOVE_Y, moveY);
  };

  const handleToggle = (state, setState, topic) => {
    const newState = state === 'ON' ? 'OFF' : 'ON';
    setState(newState);
    onPublish(topic, newState);
  };

  return (
    <div className="bg-white p-5 rounded-md shadow-md mb-8">
      <h2 className="text-xl text-gray-800 mb-5">Controls</h2>

      {/* Move X */}
      <div className="flex gap-2 items-center mb-5">
        <div className="flex-1">
          <label htmlFor="move-x" className="block text-gray-700 text-sm font-medium mb-1">Move X</label>
          <input
            type="number"
            id="move-x"
            placeholder="value"
            min="0"
            max="220"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={moveX}
            onChange={(e) => setMoveX(e.target.value)}
          />
        </div>
        <button
          className="bg-blue-500 mt-auto hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline text-sm"
          onClick={handleMoveX}
          disabled={!moveX}
        >
          Move X
        </button>
      </div>

      {/* Move Y */}
      <div className="flex gap-2 items-center mb-5">
        <div className="flex-1">
          <label htmlFor="move-y" className="block text-gray-700 text-sm font-medium mb-1">Move Y</label>
          <input
            type="number"
            id="move-y"
            placeholder="value"
            min="0"
            max="180"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={moveY}
            onChange={(e) => setMoveY(e.target.value)}
          />
        </div>
        <button
          className="bg-blue-500 mt-auto hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline text-sm"
          onClick={handleMoveY}
          disabled={!moveY}
        >
          Move Y
        </button>
      </div>

      {/* Toggles */}
      <div className="flex gap-2 items-center">
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline text-sm"
          onClick={() => handleToggle(laserState, setLaserState, TOPICS.LASER)}
        >
          Toggle Laser ({laserState})
        </button>
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline text-sm"
          onClick={() => handleToggle(lightState, setLightState, TOPICS.LIGHT)}
        >
          Toggle Light ({lightState})
        </button>
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline text-sm"
          onClick={() => handleToggle(buzzerState, setBuzzerState, TOPICS.BUZZER)}
        >
          Toggle Buzzer ({buzzerState})
        </button>
      </div>
    </div>
  );
}

export default ControlsCard;
