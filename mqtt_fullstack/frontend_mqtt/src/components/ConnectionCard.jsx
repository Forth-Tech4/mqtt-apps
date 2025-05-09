import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { showToast } from '../utils/ToastComponent';

function ConnectionCard({ onConnect, onDisconnect }) {
  const [hostname, setHostname] = useState('');
  const [port, setPort] = useState('');
  const [clientKey, setClientKey] = useState(null);
  const [clientCert, setClientCert] = useState(null);
  const [caCert, setCaCert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const toggleAccordion = () => { setIsOpen(!isOpen) };
  const [isConnected, setIsConnected] = useState(false);

  const clientKeyRef = useRef(null);
  const clientCertRef = useRef(null);
  const caCertRef = useRef(null);

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleConnect = async () => {
    if (isConnected) {
      showToast("info", "You are already connected.");
      return;
    }

    if (!hostname || !port) {
      showToast('error', 'Host and port are required.');
      return;
    }

    const missingCerts = [];
    if (!clientKey) missingCerts.push('Client Key');
    if (!clientCert) missingCerts.push('Client Cert');
    if (!caCert) missingCerts.push('CA Cert');

    if (missingCerts.length) {
      showToast("error", `${missingCerts.join(', ')} ${missingCerts.length > 1 ? 'are' : 'is'} required.`);
      return;
    }

    const formData = new FormData();
    formData.append('hostname', hostname);
    formData.append('port', port);
    formData.append('clientKey', clientKey);
    formData.append('clientCert', clientCert);
    formData.append('caCert', caCert);

    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/upload-certs`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.error === 'mosquitto_down') {
        showToast("error", 'Mosquitto broker is not running.');
      } else if (data.error === 'cert_failed') {
        showToast("error", 'Certificate authentication failed.');
      } else {
        onConnect(hostname, port);
        setIsConnected(true);
        showToast("success", 'Connected successfully!');
      }
    } catch (err) {
      alert('Cert Upload Failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };


  const handleClearFile = (ref, setter, key) => {
    if (ref.current) ref.current.value = '';
    setter(null);
    if (key) localStorage.removeItem(key);
  };

  const handleFileChange = async (e, setter, storageKey) => {
    const file = e.target.files[0];
    if (file) {
      setter(file);
      const base64 = await fileToBase64(file);
      const metadata = {
        name: file.name,
        type: file.type,
        data: base64,
      };
      localStorage.setItem(storageKey, JSON.stringify(metadata));
    }
  };


  useEffect(() => {
    const loadStoredCerts = () => {
      const loadFile = (key, refSetter, ref) => {
        const stored = localStorage.getItem(key);
        if (!stored) return;

        try {
          const { name, type, data } = JSON.parse(stored);
          if (!data || !name || !type) return;

          const byteString = atob(data.split(',')[1]);
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          const blob = new Blob([ab], { type });
          const file = new File([blob], name, { type });
          refSetter(file);

          // Set the file in the input for visual indication (optional)
          if (ref.current) {
            const dt = new DataTransfer();
            dt.items.add(file);
            ref.current.files = dt.files;
          }
        } catch (err) {
          console.error(`Failed to parse ${key}`, err);
        }
      };

      loadFile('clientKey', setClientKey, clientKeyRef);
      loadFile('clientCert', setClientCert, clientCertRef);
      loadFile('caCert', setCaCert, caCertRef);
    };

    loadStoredCerts();
  }, []);

  const handleDisconnect = () => {
    if (!isConnected) {
      showToast("warning", "Please connect first. You are already disconnected.");
      return;
    }

    onDisconnect();
    setIsConnected(false);
    showToast("success", "Disconnected successfully.");
  };



  return (
    <div className="bg-white p-5 rounded-md shadow-md mb-2">
      <div className="flex justify-between cursor-pointer" onClick={toggleAccordion}>

        <h2 className="mb-5 text-2xl font-semibold text-gray-800">Connection</h2>
        <FontAwesomeIcon
          icon={isOpen ? 'angle-up' : 'angle-down'}
          className="transition-transform duration-300"
        />

      </div>

      {isOpen && (<>
        <div className="flex gap-4 mb-5 flex-wrap">
          <div className="flex-1 mb-5">
            <label htmlFor="host" className="block text-gray-700 text-sm font-medium mb-1">Host</label>
            <input
              type="text"
              id="host"
              placeholder="Host"
              value={hostname}
              onChange={(e) => setHostname(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div className="flex-1 mb-5">
            <label htmlFor="port" className="block text-gray-700 text-sm font-medium mb-1">Port</label>
            <input
              type="number"
              id="port"
              placeholder="Port"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div className="flex-1 mb-5">
            <label htmlFor="clientId" className="block text-gray-700 text-sm font-medium mb-1">Client ID</label>
            <input
              type="text"
              id="clientId"
              readOnly
              value="react-client"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
        </div>

        {/* Client Key */}
        <div className="mb-4">
          <label htmlFor="clientKey" className="block text-gray-700 text-sm font-medium mb-1">Client Key:</label>
          <div className="flex items-center gap-2">
            <input
              type="file"
              id="clientKey"
              ref={clientKeyRef}
              onChange={(e) => handleFileChange(e, setClientKey, 'clientKey')}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:shadow-outline text-sm"
            />
            <button
              type="button"
              onClick={() => handleClearFile(clientKeyRef, setClientKey, 'clientKey')}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline text-sm"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Client Cert */}
        <div className="mb-4">
          <label htmlFor="clientCert" className="block text-gray-700 text-sm font-medium mb-1">Client Cert:</label>
          <div className="flex items-center gap-2">
            <input
              type="file"
              id="clientCert"
              ref={clientCertRef}
              onChange={(e) => handleFileChange(e, setClientCert, 'clientCert')}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:shadow-outline text-sm"
            />
            <button
              type="button"
              onClick={() => handleClearFile(clientCertRef, setClientCert, 'clientCert')}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline text-sm"
            >
              Clear
            </button>
          </div>
        </div>

        {/* CA Cert */}
        <div className="mb-4">
          <label htmlFor="caCert" className="block text-gray-700 text-sm font-medium mb-1">CA Cert:</label>
          <div className="flex items-center gap-2">
            <input
              type="file"
              id="caCert"
              ref={caCertRef}
              onChange={(e) => handleFileChange(e, setCaCert, 'caCert')}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:shadow-outline text-sm"
            />
            <button
              type="button"
              onClick={() => handleClearFile(caCertRef, setCaCert, 'caCert')}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline text-sm"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            disabled={loading}
            onClick={handleConnect}
            className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Connecting...' : 'Connect'}
          </button>
          <button
            onClick={handleDisconnect}
            className="bg-white text-red-500 border border-red-500 hover:bg-red-500 hover:text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Disconnect
          </button>
        </div>
      </>)}
    </div>
  );
}

export default ConnectionCard;
