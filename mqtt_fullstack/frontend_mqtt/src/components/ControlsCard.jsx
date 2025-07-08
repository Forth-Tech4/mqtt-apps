import React, { useState } from 'react';
import { showToast } from '../utils/ToastComponent';

function ControlsCard({ onPublish, clientId, deviceState, activeMac, setMacAddress }) {
  const [panValue, setPanValue] = useState(deviceState.pan || 0);
  const [tiltValue, setTiltValue] = useState(deviceState.tilt || 0);
  const TOPIC_PREFIX = clientId || 'unknown';
  const laserState = deviceState.laser ? 'ON' : 'OFF';
  const lightState = deviceState.light ? 'ON' : 'OFF';
  const buzzerState = deviceState.buzzer || 'off';
  const waterState = deviceState.water ? 'ON' : 'OFF';

  // State for Software Update (OTA) configuration
  const [softwareUpdate, setSoftwareUpdate] = useState({
    feature: "softwareupdate",
    server: "193.203.185.170",
    user: "u705728519",
    pass: "mqttApp@123",
    filepath: "/Gimble/firmware.bin",
    type: "firmware"
  });

  // State for Security Update configuration (UI Only, disabled button)
  const [securityUpdate, setSecurityUpdate] = useState({
    feature: "securityupdate",
    server: "192.168.1.1",
    user: "admin",
    pass: "admin@123",
    filepath: "/Gimble/security.bin",
    type: "patch"
  });

  // Helper to publish a command (uses the onPublish prop)
  const sendCommand = (peripheral, payload) => {
    // onPublish now handles the connection check and re-connection logic
    onPublish(peripheral, payload, activeMac);
  };

  // --- Individual Peripheral Controls ---

  const handlePanChange = (e) => {
    const value = Number(e.target.value);
    setPanValue(value);
    // sendCommand('pan', { value }); // Send command on release or on button click
  };

  const handleTiltChange = (e) => {
    const value = Number(e.target.value);
    setTiltValue(value);
    // sendCommand('tilt', { value }); // Send command on release or on button click
  };

  const toggleLight = () => {
    const newValue = lightState === 'ON' ? 0 : 1;
    sendCommand('light', { value: newValue });
  }

  const toggleLaser = () => {
    const newValue = laserState === 'ON' ? 0 : 1;
    sendCommand('laser', { value: newValue });
  };

  const toggleWater = () => {
    const newValue = waterState === 'ON' ? 0 : 1;
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
    // Using setTimeout with small delays to simulate a sequence
    setTimeout(() => sendCommand('pan', { value: 90 }), 0);
    setTimeout(() => sendCommand('tilt', { value: 45 }), 100);
    setTimeout(() => sendCommand('light', { value: 1 }), 200);
    setTimeout(() => sendCommand('laser', { value: 1 }), 300);
    setTimeout(() => sendCommand('buzzer', { mode: 'notification' }), 400);
    setTimeout(() => sendCommand('buzzer', { mode: 'off' }), 1000);
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
    // Send commands to turn off all active peripherals and return motors to current state
    sendCommand('buzzer', { mode: 'off' });
    sendCommand('light', { value: 0 });
    sendCommand('laser', { value: 0 });
    // Keep pan/tilt at current state on emergency stop
    sendCommand('pan', { value: deviceState.pan });
    sendCommand('tilt', { value: deviceState.tilt });
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
          Publishing to topics with prefix: <span className="font-mono bg-gray-100 px-1 rounded">{TOPIC_PREFIX}/{activeMac ? `${activeMac}/` : ''}...</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Pan Control */}
        <div className="flex flex-col gap-3 p-4 border rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-700">Pan Motor Control</h3>
          <label htmlFor="pan-value" className="text-sm font-medium text-gray-600">
            Set Value: {panValue}° (-180° to 180°)
            <br />
            <span className="text-xs text-blue-600 font-medium">
              Current Position: {deviceState.pan}°
            </span>
          </label>

          <input
            type="range"
            id="pan-value"
            min={-180}
            max={180}
            step={1}
            value={panValue}
            onChange={handlePanChange}
            className="w-full appearance-none bg-gray-200 h-2 rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:bg-gray-600 [&::-webkit-slider-thumb]:rounded-full"
            disabled={!clientId}
          />
          <div className="flex justify-between text-xs text-gray-500 px-1">
            <span>-180°</span>
            <span>0°</span>
            <span>180°</span>
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
          <label htmlFor="tilt-value" className="text-sm font-medium text-gray-600">
            Set Value: {tiltValue}° (-60° to +90°)
            <br />
            <span className="text-xs text-blue-600 font-medium">
              Current Position: {deviceState.tilt}°
            </span>
          </label>

          <input
            type="range"
            id="tilt-value"
            min={-60}
            max={90}
            step={1}
            value={tiltValue}
            onChange={handleTiltChange}
            className="w-full appearance-none bg-gray-200 h-2 rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:bg-gray-600 [&::-webkit-slider-thumb]:rounded-full"
            disabled={!clientId}
          />
          <div className="flex justify-between text-xs text-gray-500 px-1">
            <span>-60°</span>
            <span className='mr-9'>0°</span>
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

        {/* Software Update / OTA Section */}
        <div className="flex flex-col gap-3 p-4 border rounded-lg shadow-sm col-span-full">
          <h3 className="text-lg font-medium text-gray-700">Software Update</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {["server", "user", "pass", "filepath", "type"].map((field) => (
              <div key={field} className="flex flex-col gap-1">
                <label className="text-sm text-gray-600 capitalize" htmlFor={`software-${field}`}>
                  {field === "pass" ? "Password" : field.charAt(0).toUpperCase() + field.slice(1)}
                </label>
                <input
                  id={`software-${field}`}
                  type="text"
                  placeholder={field}
                  value={softwareUpdate[field]}
                  onChange={(e) =>
                    setSoftwareUpdate((prev) => ({ ...prev, [field]: e.target.value }))
                  }
                  className="border border-gray-300 rounded px-3 py-2 text-sm"
                />
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              // The sendCommand function now handles the connection check
              const payload = { ...softwareUpdate };
              sendCommand("softwareupdate", payload); // Corrected feature name
            }}
            className="mt-3 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition w-fit"
            disabled={!clientId} // Disable if not connected
          >
            OTA
          </button>
        </div>

        {/* Security Update Section (UI Only - disabled) */}
        <div className="flex flex-col gap-3 p-4 border rounded-lg shadow-sm col-span-full">
          <h3 className="text-lg font-medium text-gray-700">Security Update</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {["server", "user", "pass", "filepath", "type"].map((field) => (
              <div key={field} className="flex flex-col gap-1">
                <label className="text-sm text-gray-600 capitalize" htmlFor={`security-${field}`}>
                  {field === "pass" ? "Password" : field.charAt(0).toUpperCase() + field.slice(1)}
                </label>
                <input
                  id={`security-${field}`}
                  type="text"
                  placeholder={field}
                  value={securityUpdate[field]}
                  onChange={(e) =>
                    setSecurityUpdate((prev) => ({ ...prev, [field]: e.target.value }))
                  }
                  className="border border-gray-300 rounded px-3 py-2 text-sm"
                />
              </div>
            ))}
          </div>
          <button
            className="mt-3 bg-gray-500 text-white font-medium py-2 px-4 rounded transition w-fit"
            disabled // This button is intentionally disabled
          >
            submit
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