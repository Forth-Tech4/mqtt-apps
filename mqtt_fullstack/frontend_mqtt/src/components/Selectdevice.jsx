import React, { useEffect, useState } from 'react';
import { showToast } from '../utils/ToastComponent';

const LOCAL_KEY = 'savedMacAddresses';
const ACTIVE_KEY = 'activeMac';

// Receive initialMacAddresses as a prop
const SelectDevice = ({ onMacChange, initialMacAddresses = [] }) => {
  const [macInput, setMacInput] = useState('');
  const [macList, setMacList] = useState([]);
  const [activeMac, setActiveMac] = useState('');

  useEffect(() => {
    // This useEffect runs when initialMacAddresses or onMacChange changes.
    // It is responsible for initializing macList and activeMac based on both
    // fetched user data and locally stored data.

    const storedLocalMacs = JSON.parse(localStorage.getItem(LOCAL_KEY)) || [];
    
    // Combine fetched MACs (initialMacAddresses) with locally stored MACs (storedLocalMacs)
    // ensuring uniqueness. The order in Set ensures initialMacAddresses come first
    // if there are duplicates, but for persistence, it just ensures all are present.
    const newCombinedMacs = Array.from(new Set([...initialMacAddresses, ...storedLocalMacs]));
    
    // Always update macList with the new combined list.
    // This ensures that any locally added MACs are re-integrated on refresh.
    // React's reconciliation will handle efficient updates.
    setMacList(newCombinedMacs);

    // Determine the active MAC address
    const activeFromStorage = localStorage.getItem(ACTIVE_KEY);
    let newActiveMac = '';

    if (activeFromStorage && newCombinedMacs.includes(activeFromStorage)) {
      newActiveMac = activeFromStorage;
    } else if (newCombinedMacs.length > 0) {
      newActiveMac = newCombinedMacs[0]; 
    }
    

    if (newActiveMac !== activeMac) {
      setActiveMac(newActiveMac);
    
      if (newActiveMac) {
        localStorage.setItem(ACTIVE_KEY, newActiveMac);
      } else {
        localStorage.removeItem(ACTIVE_KEY);
      }
      
      onMacChange && onMacChange(newActiveMac);
    }

  }, [initialMacAddresses, onMacChange]);

 
  useEffect(() => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(macList));
  }, [macList]); // Dependency: macList state

  const addMac = () => {
    const trimmed = macInput.trim();
    if (!trimmed) {
      showToast("error", "MAC address cannot be empty.");
      return;
    }
    if (!macList.includes(trimmed)) {
      const updated = [...macList, trimmed];
      setMacList(updated); 
      setActiveMac(trimmed); 
      localStorage.setItem(ACTIVE_KEY, trimmed); // Persist active MAC
      onMacChange(trimmed);
      showToast("success", `MAC address '${trimmed}' added.`);
    } else {
      showToast("info", "MAC address already exists.");
    }
    setMacInput('');
  };

  const deleteMac = (mac) => {
    const filtered = macList.filter(item => item !== mac);
    setMacList(filtered); 
    if (mac === activeMac) {
      const newActive = filtered.length > 0 ? filtered[0] : '';
      setActiveMac(newActive);
      if (newActive) {
        localStorage.setItem(ACTIVE_KEY, newActive);
      } else {
        localStorage.removeItem(ACTIVE_KEY);
      }
      onMacChange(newActive);
    }
    showToast("info", `MAC address '${mac}' deleted.`);
  };

  const selectMac = (mac) => {
    if (mac === activeMac) {
      setActiveMac('');
      localStorage.removeItem(ACTIVE_KEY);
      onMacChange('');
    } else {
      setActiveMac(mac);
      localStorage.setItem(ACTIVE_KEY, mac);
      onMacChange(mac);
    }
  };

  return (
    <div className="bg-white p-5 rounded-md shadow-md w-full mx-auto mb-4">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Select Device Address</h2>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={macInput}
          onChange={(e) => setMacInput(e.target.value)}
          placeholder="Enter MAC (e.g. AA:BB:CC:DD)"
          className="flex-1 px-3 py-2 border rounded text-sm text-gray-700"
        />
        <button
          onClick={addMac}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
        >
          Add
        </button>
      </div>

      {/* Conditional rendering based on macList length */}
      {macList.length === 0 ? (
        <p className="text-center text-gray-500 mt-4">No assigned MAC addresses. Add one above.</p>
      ) : (
        <ul className="space-y-2">
          {macList.map((mac, idx) => (
            <li
              key={mac} // Using mac as key for stable identification
              className={`flex items-center justify-between px-4 py-2 border rounded ${mac === activeMac ? 'bg-green-100 border-green-300' : 'bg-gray-50 border-gray-200'}`}
            >
              <span
                onClick={() => selectMac(mac)}
                className={`cursor-pointer w-full font-mono text-sm ${mac === activeMac ? 'text-green-700 font-bold' : 'text-gray-700'}`}
              >
                {mac}
              </span>
              <button
                onClick={() => deleteMac(mac)}
                className="text-red-500 hover:text-red-600 text-sm"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
      
      {activeMac && (
        <div className="mt-4 text-sm text-green-700">
          Currently selected: <span className="font-mono font-semibold">{activeMac}</span>
        </div>
      )}
    </div>
  );
};

export default SelectDevice;
