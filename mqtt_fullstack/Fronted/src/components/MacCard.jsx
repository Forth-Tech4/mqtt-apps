import React, { useState } from "react";
import ConfigForm from "./ConfigForm";

export default function MacCard({ device, onStatusChange }) {
  const [showConfig, setShowConfig] = useState(false);

  const handleConfigSubmit = (formData) => {
    const session = JSON.parse(localStorage.getItem("userSession"));
    const userId = session?.id;
    const key = `user_config_${userId}`;

    const allConfigs = JSON.parse(localStorage.getItem(key)) || {};
    allConfigs[device.macaddress] = formData;

    localStorage.setItem(key, JSON.stringify(allConfigs));

    onStatusChange(device.macaddress, "config"); 

    setShowConfig(false);
  };

  return (
    <div className="bg-white shadow rounded-lg p-4 space-y-2">
      <div className="text-sm text-gray-700 font-semibold">
        MAC: <span className="text-black">{device.macaddress}</span>
      </div>
      <div className="text-sm text-gray-700">
        SSID: <span className="text-black">{device.qr_ssid}</span>
      </div>
      <div className="text-sm text-gray-700">
        Pass: <span className="text-black">{device.qr_pass}</span>
      </div>
      <div className="text-sm text-gray-700">
        Status:{" "}
        <span
          className={
            device.status === "config"
              ? "text-green-600 font-semibold"
              : "text-yellow-600 font-semibold"
          }
        >
          {device.status === "config" ? "Configured" : "Unconfigured"}
        </span>
      </div>

      {device.status !== "config" && (
        <button
          onClick={() => setShowConfig(true)}
          className="mt-2 px-4 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded shadow"
        >
          Configure
        </button>
      )}

      {showConfig && (
        <ConfigForm
          device={device}
          onSubmit={handleConfigSubmit}
          onCancel={() => setShowConfig(false)}
        />
      )}
    </div>
  );
}
