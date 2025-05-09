import React, { useState } from 'react';
import { showToast } from '../utils/ToastComponent';

const TOPICS = {
  MOVE_X: 'op/move/x',
  MOVE_Y: 'op/move/y',
  LASER: 'op/laser',
  LIGHT: 'op/light',
  BUZZER: 'op/buzzer',
  WATER: 'op/water'
};

function ControlsCard({ onPublish }) {
  const [moveX, setMoveX] = useState(0);
  const [moveY, setMoveY] = useState(0);
  const [laserState, setLaserState] = useState('OFF');
  const [lightState, setLightState] = useState('OFF');
  const [buzzerState, setBuzzerState] = useState('OFF');
  const [waterState, setWaterState] = useState('OFF');

 const handleMoveX = () => {
  if (moveX === null || moveX === undefined || isNaN(moveX)) {
    showToast("error" ,"Invalid value for Move X");
    return;
  }
  onPublish(TOPICS.MOVE_X, moveX.toString());
};

const handleMoveY = () => {
  if (moveY === null || moveY === undefined || isNaN(moveY)) {
    showToast("error" ,"Invalid value for Move Y");
    return;
  }
  onPublish(TOPICS.MOVE_Y, moveY.toString());
};


  const handleToggle = (state, setState, topic) => {
    const newState = state === 'ON' ? 'OFF' : 'ON';
    setState(newState);
    onPublish(topic, newState);
  };

  return (
    <div className="bg-white p-5 rounded-md shadow-md w-full max-w-4xl mx-auto mb-2">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">Controls</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left side: sliders */}
        <div className="md:col-span-2 flex flex-col gap-6">
          {/* Move X */}
          <div className="flex flex-col gap-3">
            <label htmlFor="move-x" className="text-sm font-medium text-gray-600">Move X</label>
            <input
              type="range"
              id="move-x"
              min="0"
              max="220"
              step="1"
              value={moveX}
              onChange={(e) => setMoveX(Number(e.target.value))}
              className="w-full"
            />
            <span className="text-gray-700">Value: {moveX}</span>
            <button
              onClick={handleMoveX}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded transition"
            >
              Move X
            </button>
          </div>

          {/* Move Y */}
          <div className="flex flex-col gap-3">
            <label htmlFor="move-y" className="text-sm font-medium text-gray-600">Move Y</label>
            <input
              type="range"
              id="move-y"
              min="0"
              max="180"
              step="1"
              value={moveY}
              onChange={(e) => setMoveY(Number(e.target.value))}
              className="w-full"
            />
            <span className="text-gray-700">Value: {moveY}</span>
            <button
              onClick={handleMoveY}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded transition"
            >
              Move Y
            </button>
          </div>
        </div>

        {/* Right side: toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-6">
          <button
            onClick={() => handleToggle(laserState, setLaserState, TOPICS.LASER)}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded transition"
          >
            Laser ({laserState})
          </button>
          <button
            onClick={() => handleToggle(lightState, setLightState, TOPICS.LIGHT)}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded transition"
          >
            Light ({lightState})
          </button>
          <button
            onClick={() => handleToggle(buzzerState, setBuzzerState, TOPICS.BUZZER)}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded transition"
          >
            Buzzer ({buzzerState})
          </button>
          <button
            onClick={() => handleToggle(waterState, setWaterState, TOPICS.WATER)}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded transition"
          >
            Water ({waterState})
          </button>
        </div>
      </div>
    </div>
  );
}

export default ControlsCard;
