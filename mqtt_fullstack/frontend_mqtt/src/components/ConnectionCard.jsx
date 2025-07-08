import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleDown, faAngleUp } from '@fortawesome/free-solid-svg-icons';
import { showToast } from '../utils/ToastComponent';
// Remove pkijs and asn1js imports as they are no longer needed for client ID extraction
// import * as pkijs from 'pkijs';
// import * as asn1js from 'asn1js';
// window.pkijs = pkijs;
// window.asn1js = asn1js;

function ConnectionCard({ onConnect, onDisconnect, setClientId }) {
  const [hostname, setHostname] = useState('');
  const [port, setPort] = useState('');
  const [clientIdInput, setClientIdInput] = useState("");
  const [clientKey, setClientKey] = useState(null);
  const [clientCert, setClientCert] = useState(null);
  const [caCert, setCaCert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const clientKeyRef = useRef(null);
  const clientCertRef = useRef(null);
  const caCertRef = useRef(null);

  const toggleAccordion = () => setIsOpen(!isOpen);
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e, setter, key) => {
    const file = e.target.files[0];
    if (file) {
      setter(file);
      const base64 = await fileToBase64(file);

      const metadata = {
        name: file.name,
        type: file.type,
        data: base64,
      };
      localStorage.setItem(key, JSON.stringify(metadata));
    }
  };

  const handleClearFile = (ref, setter, key) => {
    if (ref.current) ref.current.value = '';
    setter(null);
    if (key) localStorage.removeItem(key);
  };

  const handleConnect = async () => {
    if (!hostname || !port) {
      showToast("error", "Host and port are required.");
      return;
    }

    if (!clientIdInput) {
      showToast("error", "Client ID is required.");
      return;
    }

    if (isConnected) {
      showToast("info", "You are already connected.");
      return;
    }

    if (!clientKey || !clientCert || !caCert) {
      showToast("error", "All certificate files are required.");
      return;
    }

    const formData = new FormData();
    formData.append('hostname', hostname);
    formData.append('port', port);
    formData.append('clientKey', clientKey);
    formData.append('clientCert', clientCert);
    formData.append('caCert', caCert);
    formData.append('clientId', clientIdInput);

    setLoading(true);
    try {

      // const res = await fetch(`http://${import.meta.env.VITE_FRONTEND_URL}/upload-certs`, {           // for local
         const res = await fetch(`https://${import.meta.env.VITE_FRONTEND_URL}/upload-certs`, {       // for live server

        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.error === 'mosquitto_down') {
        showToast("error", "Mosquitto broker is not running.");
      } else if (data.error === 'cert_failed') {
        showToast("error", "Certificate authentication failed.");
      } else {
        showToast("success", `Connected to MQTT broker as ${clientIdInput}`);
        setClientId(clientIdInput); // Set the client ID in the parent state
        setClientIdInput(clientIdInput); // Update local state if needed (though it's constant)
        onConnect(hostname, port, clientIdInput);
        setIsConnected(true);
      }
    } catch (err) {
      showToast("error", "Connection failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    if (!isConnected) {
      showToast("warning", "You are already disconnected.");
      return;
    }
    onDisconnect();
    setIsConnected(false);
    showToast("error", "Disconnected successfully.");
  };

  useEffect(() => {
    const loadFile = (key, setter, ref) => {
      const stored = localStorage.getItem(key);
      if (!stored) return;

      try {
        const { name, type, data } = JSON.parse(stored);
        const byteString = atob(data.split(',')[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type });
        const file = new File([blob], name, { type });
        setter(file);

        setTimeout(() => {
          if (ref.current) {
            const dt = new DataTransfer();
            dt.items.add(file);
            ref.current.files = dt.files;
          }
        }, 0);
      } catch (err) {
        console.error(`Failed to load ${key}`, err);
      }
    };

    loadFile('clientKey', setClientKey, clientKeyRef);
    loadFile('clientCert', setClientCert, clientCertRef);
    loadFile('caCert', setCaCert, caCertRef);
  }, []);


  return (
    <div className="bg-white p-5 rounded-md shadow-md mb-2">
      <div className="flex justify-between items-center cursor-pointer" onClick={toggleAccordion}>
        <h2 className="text-2xl font-semibold text-gray-800">Connection</h2>
        <FontAwesomeIcon icon={isOpen ? faAngleUp : faAngleDown} />
      </div>

      {isOpen && (
        <>
          <div className="flex gap-4 mb-5 flex-wrap flex-col md:flex-row">
            <div className="flex-1 mb-5">
              <label htmlFor="host" className="block text-gray-700 text-sm font-medium mb-1">Host</label>
              <input
                type="text"
                id="host"
                value={hostname}
                onChange={(e) => setHostname(e.target.value)}
                className="shadow border rounded w-full py-2 px-3"
              />
            </div>
            <div className="flex-1 mb-5">
              <label htmlFor="port" className="block text-gray-700 text-sm font-medium mb-1">Port</label>
              <input
                type="number"
                id="port"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                className="shadow border rounded w-full py-2 px-3"
              />
            </div>
            <div className="flex-1 mb-5">
              <label htmlFor="clientId" className="block text-gray-700 text-sm font-medium mb-1">Client ID</label>
              <input
                type="text"
                id="clientId"
                value={clientIdInput}
                onChange={(e) => setClientIdInput(e.target.value)}
                placeholder="Enter Client ID"
                className="shadow border rounded w-full py-2 px-3"
              />
            </div>
          </div>

          {[
            { id: 'clientKey', label: 'Client Key', ref: clientKeyRef, setter: setClientKey },
            { id: 'clientCert', label: 'Client Cert', ref: clientCertRef, setter: setClientCert },
            { id: 'caCert', label: 'CA Cert', ref: caCertRef, setter: setCaCert }
          ].map(({ id, label, ref, setter }) => (
            <div key={id} className="mb-4">
              <label htmlFor={id} className="block text-gray-700 text-sm font-medium mb-1">{label}:</label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id={id}
                  ref={ref}
                  onChange={(e) => handleFileChange(e, setter, id)}
                  className="shadow border rounded w-full py-2 px-3 text-sm"
                />
                <button
                  type="button"
                  onClick={() => handleClearFile(ref, setter, id)}
                  className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded text-sm"
                >
                  Clear
                </button>
              </div>
            </div>
          ))}

          <div className="flex gap-2">
            <button
              disabled={loading}
              onClick={handleConnect}
              className={`bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded ${loading ? 'opacity-50' : ''}`}
            >
              {loading ? 'Connecting...' : 'Connect'}
            </button>
            <button
              onClick={handleDisconnect}
              className="bg-white text-red-500 border border-red-500 hover:bg-red-500 hover:text-white py-2 px-4 rounded"
            >
              Disconnect
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default ConnectionCard;