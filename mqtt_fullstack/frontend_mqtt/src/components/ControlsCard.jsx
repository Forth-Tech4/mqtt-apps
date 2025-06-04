import React, { useState } from 'react';
import { showToast } from '../utils/ToastComponent';

function ControlsCard({ onPublish, clientId, deviceState, activeMac, setMacAddress }) {
  const [panValue, setPanValue] = useState(deviceState.pan || 0);
  const [tiltValue, setTiltValue] = useState(deviceState.tilt || 0);
  

  const TOPIC_PREFIX = clientId || 'unknown';

  const laserState = deviceState.laser ? 'ON' : 'OFF';
  const lightState = deviceState.light ? 'ON' : 'OFF';
  
  const buzzerState = deviceState.buzzer || 'off'; // Use the actual mode as state
  const waterState = deviceState.water ? 'ON' : 'OFF'; // Assuming water is a simple ON/OFF like light/laser

  // Helper to publish a command
  const sendCommand = (peripheral, payload) => {
    if (!clientId) {
      showToast('error', 'Not connected. Please connect first.');
      return;
    }
    console.log(activeMac)

    // if (!activeMac) {
    //   showToast('error', 'Please select or add a device address first!');
    //   return;
    // }

    onPublish(peripheral, payload);
  };

// const sendCommand = (peripheral, payload, sendToAll = false) => {
//   if (!clientId) {
//     showToast('error', 'Not connected. Please connect first.');
//     return;
//   }

//   if (!sendToAll && !activeMac) {
//     showToast('error', 'Please select or add a device address first!');
//     return;
//   }

//   const targetMac = sendToAll ? '' : activeMac;
//   onPublish(peripheral, payload, targetMac); // 
// };

  // --- Individual Peripheral Controls ---

  const handlePanChange = (e) => {
    const value = Number(e.target.value);
    setPanValue(value);
    // sendCommand('pan', { value });
  };

  const handleTiltChange = (e) => {
    const value = Number(e.target.value);
    setTiltValue(value);
    // sendCommand('tilt', { value });
  };

  const toggleLight = () => {
    

      const newValue = lightState === 'ON' ? 0 : 1; // Toggle 0/1
      sendCommand('light', { value: newValue });
    
  }

// const toggleLightAll = () => {
//   const newValue = lightState === 'ON' ? 0 : 1;
//   sendCommand('light', { value: newValue }, true); // sendToAll = true
// };


  const toggleLaser = () => {
    const newValue = laserState === 'ON' ? 0 : 1; // Toggle 0/1
    sendCommand('laser', { value: newValue });
  };

  const toggleWater = () => {
    const newValue = waterState === 'ON' ? 0 : 1; // Toggle 0/1
    sendCommand('water', { value: newValue });
  };

  // --- Buzzer Control Modes ---
  const setBuzzerMode = (mode) => {
    sendCommand('buzzer', { mode });
  };

  // --- Preset Positions ---
  const setHomePosition = () => {
    setPanValue(0);
    setTiltValue(0);
    sendCommand('pan', { value: 0 });
    sendCommand('tilt', { value: 0 });
    showToast('info', 'Setting home position (Pan: 0°, Tilt: 0°)');
  };

  const setRearDownPosition = () => {
    setPanValue(180);
    setTiltValue(-45);
    sendCommand('pan', { value: 180 });
    sendCommand('tilt', { value: -45 });
    showToast('info', 'Setting rear-down position (Pan: 180°, Tilt: -45°)');
  };

  const setLeftUpPosition = () => {
    setPanValue(-90);
    setTiltValue(30);
    sendCommand('pan', { value: -90 });
    sendCommand('tilt', { value: 30 });
    showToast('info', 'Setting left-up position (Pan: -90°, Tilt: 30°)');
  };

  // --- System Sequences ---
  const runCompleteSystemTestSequence = () => {
    if (!clientId) {
      showToast('error', 'Not connected. Please connect first.');
      return;
    }
    showToast('info', 'Initiating Complete System Test Sequence...');
    // Send commands with small delays to simulate a sequence and avoid overwhelming the system
    setTimeout(() => sendCommand('pan', { value: 90 }), 0);
    setTimeout(() => sendCommand('tilt', { value: 45 }), 100);
    setTimeout(() => sendCommand('light', { value: 1 }), 200);
    setTimeout(() => sendCommand('laser', { value: 1 }), 300);
    setTimeout(() => sendCommand('buzzer', { mode: 'notification' }), 400);
    setTimeout(() => sendCommand('buzzer', { mode: 'off' }), 1000); // Give notification time to play
    setTimeout(() => sendCommand('light', { value: 0 }), 1100);
    setTimeout(() => sendCommand('laser', { value: 0 }), 1200);
    setTimeout(() => sendCommand('pan', { value: 0 }), 1300);
    setTimeout(() => sendCommand('tilt', { value: 0 }), 1400);
    showToast('success', 'Complete System Test Sequence commands dispatched.');
  };

  const runEmergencyStopAll = () => {
    if (!clientId) {
      showToast('error', 'Not connected. Please connect first.');
      return;
    }
    showToast('warning', 'Initiating Emergency Stop All!');
    sendCommand('buzzer', { mode: 'off' });
    sendCommand('light', { value: 0 });
    sendCommand('laser', { value: 0 });
    // If pan/tilt should also stop, add:
    sendCommand('pan', { value: deviceState.pan }); // or 0 to reset
    sendCommand('tilt', { value: deviceState.tilt }); // or 0 to reset
    showToast('success', 'Emergency Stop All commands dispatched.');
  };


  return (
    <div className="bg-white p-5 rounded-md shadow-md w-full max-w-4xl mx-auto mb-2">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">Controls</h2>
      {!clientId ? (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
          <p>Please connect first to use controls.</p>
        </div>
      ) : (
        <div className="mb-2 text-sm text-gray-600">
          Publishing to topics with prefix: <span className="font-mono bg-gray-100 px-1 rounded">{TOPIC_PREFIX}/...</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Pan Control */}
        <div className="flex flex-col gap-3 p-4 border rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-700">Pan Motor Control</h3>
          <label htmlFor="pan-value" className="text-sm font-medium text-gray-600">Value: {panValue}° (0° to 360°)</label>
          <input
            type="range"
            id="pan-value"
            min={0}
            max={360}
            step={1}
            value={panValue}
            onChange={handlePanChange}
            className="w-full appearance-none bg-gray-200 h-2 rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:bg-gray-600 [&::-webkit-slider-thumb]:rounded-full"
            disabled={!clientId}
          />
          <div className="flex justify-between text-xs text-gray-500 px-1">
            <span>0°</span>
            <span>180°</span>
            <span>360°</span>
          </div>
          <button
            onClick={() => sendCommand('pan', { value: panValue })} // Explicitly send current slider value
            className={`${clientId ? 'bg-blue-500 hover:bg-blue-600' : 'bg-blue-300 cursor-not-allowed'} text-white font-medium py-2 px-4 rounded transition`}
            disabled={!clientId}
          >
            Set Pan Position
          </button>
        </div>

        {/* Tilt Control */}
        <div className="flex flex-col gap-3 p-4 border rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-700">Tilt Motor Control</h3>
          <label htmlFor="tilt-value" className="text-sm font-medium text-gray-600">Value: {tiltValue}° (-90° to +90°)</label>
          <input
            type="range"
            id="tilt-value"
            min={-90}
            max={90}
            step={1}
            value={tiltValue}
            onChange={handleTiltChange}
            className="w-full appearance-none bg-gray-200 h-2 rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:bg-gray-600 [&::-webkit-slider-thumb]:rounded-full"
            disabled={!clientId}
          />
          <div className="flex justify-between text-xs text-gray-500 px-1">
            <span>-90°</span>
            <span>0°</span>
            <span>+90°</span>
          </div>
          <button
            onClick={() => sendCommand('tilt', { value: tiltValue })} // Explicitly send current slider value
            className={`${clientId ? 'bg-blue-500 hover:bg-blue-600' : 'bg-blue-300 cursor-not-allowed'} text-white font-medium py-2 px-4 rounded transition`}
            disabled={!clientId}
          >
            Set Tilt Position
          </button>
        </div>

        {/* Buzzer Control */}
        <div className="flex flex-col gap-3 p-4 border rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-700">Buzzer Control</h3>
          <p className="text-sm text-gray-600">Current Mode: <span className="font-semibold">{buzzerState.toUpperCase()}</span></p>
          <button onClick={() => setBuzzerMode('alert')} className={`${clientId ? 'bg-gray-200 hover:bg-gray-300' : 'bg-gray-100 cursor-not-allowed'} text-gray-800 font-medium py-2 px-4 rounded transition`} disabled={!clientId}>Alert (3 short beeps)</button>
          <button onClick={() => setBuzzerMode('warning')} className={`${clientId ? 'bg-gray-200 hover:bg-gray-300' : 'bg-gray-100 cursor-not-allowed'} text-gray-800 font-medium py-2 px-4 rounded transition`} disabled={!clientId}>Warning (2 long beeps)</button>
          <button onClick={() => setBuzzerMode('notification')} className={`${clientId ? 'bg-gray-200 hover:bg-gray-300' : 'bg-gray-100 cursor-not-allowed'} text-gray-800 font-medium py-2 px-4 rounded transition`} disabled={!clientId}>Notification (Single beep)</button>
          <button onClick={() => setBuzzerMode('off')} className={`${clientId ? 'bg-red-500 hover:bg-red-600' : 'bg-red-300 cursor-not-allowed'} text-white font-medium py-2 px-4 rounded transition`} disabled={!clientId}>Turn Off Buzzer</button>
        </div>

        {/* Light Control */}
        <div className="flex flex-col gap-3 p-4 border rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-700">Light Control</h3>
          <p className="text-sm text-gray-600">Status: <span className="font-semibold">{lightState}</span></p>
          <button
            onClick={toggleLight}
            className={`${clientId ? 'bg-gray-200 hover:bg-gray-300' : 'bg-gray-100 cursor-not-allowed'} text-gray-800 font-medium py-2 px-4 rounded transition`}
            disabled={!clientId}
          >
            Turn {lightState === 'ON' ? 'OFF' : 'ON'} Light
          </button>
          {/* <button
            onClick={toggleLightAll}
            className={`${clientId ? 'bg-gray-200 hover:bg-gray-300' : 'bg-gray-100 cursor-not-allowed'} text-gray-800 font-medium py-2 px-4 rounded transition`}
            disabled={!clientId}
          >
            Turn {lightState === 'ON' ? 'OFF' : 'ON'} Light for all devices
          </button> */}

        </div>

        {/* Laser Control */}
        <div className="flex flex-col gap-3 p-4 border rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-700">Laser Control</h3>
          <p className="text-sm text-gray-600">Status: <span className="font-semibold">{laserState}</span></p>
          <button
            onClick={toggleLaser}
            className={`${clientId ? 'bg-gray-200 hover:bg-gray-300' : 'bg-gray-100 cursor-not-allowed'} text-gray-800 font-medium py-2 px-4 rounded transition`}
            disabled={!clientId}
          >
            Turn {laserState === 'ON' ? 'OFF' : 'ON'} Laser
          </button>
        </div>

        {/* Water Control (Assuming similar to light/laser) */}
        <div className="flex flex-col gap-3 p-4 border rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-700">Water Control</h3>
          <p className="text-sm text-gray-600">Status: <span className="font-semibold">{waterState}</span></p>
          <button
            onClick={toggleWater}
            className={`${clientId ? 'bg-gray-200 hover:bg-gray-300' : 'bg-gray-100 cursor-not-allowed'} text-gray-800 font-medium py-2 px-4 rounded transition`}
            disabled={!clientId}
          >
            Turn {waterState === 'ON' ? 'OFF' : 'ON'} Water
          </button>
        </div>

        {/* Position Presets */}
        <div className="flex flex-col gap-3 p-4 border rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-700">Position Presets</h3>
          <button onClick={setHomePosition} className={`${clientId ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-indigo-300 cursor-not-allowed'} text-white font-medium py-2 px-4 rounded transition`} disabled={!clientId}>
            Home Position (0°, 0°)
          </button>
          <button onClick={setRearDownPosition} className={`${clientId ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-indigo-300 cursor-not-allowed'} text-white font-medium py-2 px-4 rounded transition`} disabled={!clientId}>
            Rear-Down Position (180°, -45°)
          </button>
          <button onClick={setLeftUpPosition} className={`${clientId ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-indigo-300 cursor-not-allowed'} text-white font-medium py-2 px-4 rounded transition`} disabled={!clientId}>
            Left-Up Position (-90°, 30°)
          </button>
        </div>

        {/* System Test Sequences */}
        <div className="flex flex-col gap-3 p-4 border rounded-lg shadow-sm col-span-full">
          <h3 className="text-lg font-medium text-gray-700">System Sequences</h3>
          <button
            onClick={runCompleteSystemTestSequence}
            className={`${clientId ? 'bg-green-500 hover:bg-green-600' : 'bg-green-300 cursor-not-allowed'} text-white font-medium py-2 px-4 rounded transition`}
            disabled={!clientId}
          >
            Run Complete System Test Sequence
          </button>
          <button
            onClick={runEmergencyStopAll}
            className={`${clientId ? 'bg-red-600 hover:bg-red-700' : 'bg-red-400 cursor-not-allowed'} text-white font-medium py-2 px-4 rounded transition`}
            disabled={!clientId}
          >
            Emergency Stop All
          </button>
        </div>

      </div>
    </div>
  );
}

export default ControlsCard;