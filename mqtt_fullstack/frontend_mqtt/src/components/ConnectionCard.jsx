// src/components/ConnectionCard.jsx
import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleDown, faAngleUp } from '@fortawesome/free-solid-svg-icons';
import { showToast } from '../utils/ToastComponent';
import { useAuth } from '../context/AuthContext';

function ConnectionCard({ onConnect, onDisconnect }) {
  const { user } = useAuth();

  const [hostname, setHostname] = useState('');
  const [port, setPort] = useState('');
  const [clientIdInput, setClientIdInput] = useState("");
  const [clientKey, setClientKey] = useState('');
  const [clientCert, setClientCert] = useState('');
  const [caCert, setCaCert] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const clientKeyRef = useRef(null);
  const clientCertRef = useRef(null);
  const caCertRef = useRef(null);

  const toggleAccordion = () => setIsOpen(!isOpen);

  useEffect(() => {
    if (user) {
      setHostname(import.meta.env.VITE_MQTT_HOST || 'localhost');
      setPort(import.meta.env.VITE_MQTT_PORT || '9001');
      setClientIdInput(user.common_name);

      setClientKey(user.client_key || '');
      setClientCert(user.client_crt || '');
      setCaCert(user.ca_cert || '');

      showToast('info', 'Certificates loaded from user data. Ready to connect.');
    } else {
      setHostname('');
      setPort('');
      setClientIdInput('');
      setClientKey('');
      setClientCert('');
      setCaCert('');
      if (clientKeyRef.current) clientKeyRef.current.value = '';
      if (clientCertRef.current) clientCertRef.current.value = '';
      if (caCertRef.current) caCertRef.current.value = '';
    }
  }, [user]);

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
      showToast("error", "All certificate data is required. Please log in.");
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
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/upload-certs`, {
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
                placeholder="e.g., localhost"
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
                placeholder="e.g., 9001"
              />
            </div>
            <div className="flex-1 mb-5">
              <label htmlFor="clientId" className="block text-gray-700 text-sm font-medium mb-1">Client ID</label>
              <input
                type="text"
                id="clientId"
                value={clientIdInput}
                onChange={(e) => setClientIdInput(e.target.value)}
                className="shadow border rounded w-full py-2 px-3"
                placeholder="Client ID (from login)"
              />
            </div>
          </div>

          {user && (
            <div className="mb-4 text-sm text-gray-600">
              Certificates (Client Key, Client Cert, CA Cert) are automatically loaded from your login.
              <br/>
              {clientKey && <span className="block mt-1">Client Key: Loaded</span>}
              {clientCert && <span className="block">Client Cert: Loaded</span>}
              {caCert && <span className="block">CA Cert: Loaded</span>}
            </div>
          )}

          <div className="flex gap-2">
            <button
              disabled={loading || !user || !clientKey || !clientCert || !caCert}
              onClick={handleConnect}
              className={`bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded ${loading || !user || !clientKey || !clientCert || !caCert ? 'opacity-50 cursor-not-allowed' : ''}`}
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
