import React, { useState } from "react";
import ConfigForm from "./ConfigForm";

export default function MacCard({ device, onStatusChange }) {
  const [showConfig, setShowConfig] = useState(false);

  const handleConfigSubmit = (formData) => {
    // Update status in parent component
    onStatusChange(device.macaddress, "config");
    setShowConfig(false);
  };

  const handleConnectToHotspot = () => {
    alert(
      `📱 Connect to WiFi:\n\nSSID: ${device.qr_ssid}\nPassword: ${device.qr_pass}\n\nThen click Configure button.`
    );
  };

  return (
    <div className="bg-white shadow rounded-lg p-4 space-y-2">
      <div className="text-sm text-gray-700 font-semibold">
        MAC: <span className="text-black">{device.macaddress}</span>
      </div>
      <div className="text-sm text-gray-700">
        Hotspot SSID: <span className="text-black">{device.qr_ssid}</span>
      </div>
      <div className="text-sm text-gray-700">
        Hotspot Pass: <span className="text-black">{device.qr_pass}</span>
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
          {device.status === "config" ? "✅ Configured" : "⚠️ Unconfigured"}
        </span>
      </div>

      {device.status !== "config" && (
        <div className="space-y-2">
          <button
            onClick={handleConnectToHotspot}
            className="w-full px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm rounded shadow"
          >
            📱 Connect to Hotspot
          </button>
          <button
            onClick={() => setShowConfig(true)}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded shadow"
          >
            ⚙️ Configure Device
          </button>
        </div>
      )}

      {device.status === "config" && (
        <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
          <p className="text-sm text-green-700">
            ✅ Device is configured and ready to use
          </p>
        </div>
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