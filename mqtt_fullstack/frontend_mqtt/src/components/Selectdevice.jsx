import React, { useEffect, useState } from 'react';
import { showToast } from '../utils/ToastComponent'; // adjust path if needed


const LOCAL_KEY = 'savedMacAddresses';
const ACTIVE_KEY = 'activeMac';

const SelectDevice = ({ onMacChange }) => {
  const [macInput, setMacInput] = useState('');
  const [macList, setMacList] = useState([]);
  const [activeMac, setActiveMac] = useState('');

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(LOCAL_KEY)) || [];
    setMacList(stored);

    const active = localStorage.getItem(ACTIVE_KEY);
    if (active && stored.includes(active)) {
      setActiveMac(active);
      onMacChange && onMacChange(active);
    } else {
      setActiveMac('');
      onMacChange && onMacChange('');
    }
  }, []);



  const addMac = () => {
    const trimmed = macInput.trim();
    if (!trimmed) return;
    if (!macList.includes(trimmed)) {
      const updated = [...macList, trimmed];
      setMacList(updated);
      localStorage.setItem(LOCAL_KEY, JSON.stringify(updated));
      setActiveMac(trimmed); // auto-select newly added MAC
      localStorage.setItem(ACTIVE_KEY, trimmed);
      onMacChange(trimmed);
    }
    setMacInput('');
  };

  // const addMac = () => {
  //   const trimmed = macInput.trim().toUpperCase();
  //   const macRegex = /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/;

  //   if (!macRegex.test(trimmed)) {
  //     showToast('error', 'Invalid MAC address. Use format: XX:XX:XX:XX:XX:XX');
  //     return;
  //   }

  //   if (!macList.includes(trimmed)) {
  //     const updated = [...macList, trimmed];
  //     setMacList(updated);
  //     localStorage.setItem(LOCAL_KEY, JSON.stringify(updated));
  //     setActiveMac(trimmed);
  //     localStorage.setItem(ACTIVE_KEY, trimmed);
  //     onMacChange(trimmed);
  //   }
  //   setMacInput('');
  // };


  const deleteMac = (mac) => {
    const filtered = macList.filter(item => item !== mac);
    setMacList(filtered);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(filtered));
    if (mac === activeMac) {
      setActiveMac('');
      localStorage.removeItem(ACTIVE_KEY);
      onMacChange('');
    }
  };

  const selectMac = (mac) => {
    if (mac === activeMac) {
      // Unselect if already selected
      setActiveMac('');
      localStorage.removeItem(ACTIVE_KEY);
      onMacChange('');
    } else {
      // Select the new one
      setActiveMac(mac);
      localStorage.setItem(ACTIVE_KEY, mac);
      onMacChange(mac);
    }
  };


  return (
    <div className="bg-white p-5 rounded-md shadow-md w-full  mx-auto mb-4">
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

      {/* {macList.length === 0 && (
        <div className="text-sm text-red-500 mb-2">
          Please add and select a MAC address to continue.
        </div>
      )} */}

      <ul className="space-y-2">
        {macList.map((mac, idx) => (
          <li
            key={idx}
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



      {activeMac && (
        <div className="mt-4 text-sm text-green-700">
          Currently selected: <span className="font-mono font-semibold">{activeMac}</span>
        </div>
      )}
    </div>
  );
};

export default SelectDevice;
