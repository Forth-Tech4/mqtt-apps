import React, { useState, useRef } from 'react';

function ConnectionCard({ onConnect, onDisconnect }) {
  const [hostname, setHostname] = useState('');
  const [port, setPort] = useState('');
  const [clientKey, setClientKey] = useState(null);
  const [clientCert, setClientCert] = useState(null);
  const [caCert, setCaCert] = useState(null);
  const [loading, setLoading] = useState(false);

  // Refs for file inputs
  const clientKeyRef = useRef(null);
  const clientCertRef = useRef(null);
  const caCertRef = useRef(null);

  const handleConnect = async () => {
    if (!hostname || !port) {
      alert('Host and port are required.');
      return;
    }

    const formData = new FormData();
    formData.append('hostname', hostname);
    formData.append('port', port);
    if (clientKey) formData.append('clientKey', clientKey);
    if (clientCert) formData.append('clientCert', clientCert);
    if (caCert) formData.append('caCert', caCert);

    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/upload-certs', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.error === 'mosquitto_down') {
        alert('Mosquitto broker is not running.');
      } else if (data.error === 'cert_failed') {
        alert('Certificate authentication failed. Check your client.key, client.crt, or ca.crt.');
      } else {
        onConnect(hostname, port);
        alert('Connected to MQTT broker successfully!');
      }
    } catch (err) {
      alert('Cert Upload Failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFile = (ref, setter) => {
    if (ref.current) ref.current.value = '';
    setter(null);
  };

  return (
    <div className="bg-white p-5 rounded-md shadow-md mb-8">
      <h2 className="mb-5 text-xl text-gray-800">Connection</h2>
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

      <div className="mb-4">
        <label htmlFor="clientKey" className="block text-gray-700 text-sm font-medium mb-1">Client Key:</label>
        <div className="flex items-center gap-2">
          <input
            type="file"
            id="clientKey"
            ref={clientKeyRef}
            onChange={(e) => setClientKey(e.target.files[0])}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:shadow-outline text-sm"
          />
          <button
            type="button"
            onClick={() => handleClearFile(clientKeyRef, setClientKey)}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline text-sm"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="mb-4">
        <label htmlFor="clientCert" className="block text-gray-700 text-sm font-medium mb-1">Client Cert:</label>
        <div className="flex items-center gap-2">
          <input
            type="file"
            id="clientCert"
            ref={clientCertRef}
            onChange={(e) => setClientCert(e.target.files[0])}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:shadow-outline text-sm"
          />
          <button
            type="button"
            onClick={() => handleClearFile(clientCertRef, setClientCert)}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline text-sm"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="mb-4">
        <label htmlFor="caCert" className="block text-gray-700 text-sm font-medium mb-1">CA Cert:</label>
        <div className="flex items-center gap-2">
          <input
            type="file"
            id="caCert"
            ref={caCertRef}
            onChange={(e) => setCaCert(e.target.files[0])}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:shadow-outline text-sm"
          />
          <button
            type="button"
            onClick={() => handleClearFile(caCertRef, setCaCert)}
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
          onClick={onDisconnect}
          className="bg-white text-red-500 border border-red-500 hover:bg-red-500 hover:text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Disconnect
        </button>
      </div>
    </div>
  );
}

export default ConnectionCard;
