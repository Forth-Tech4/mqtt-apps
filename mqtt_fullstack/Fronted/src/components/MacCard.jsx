import React, { useState } from "react";
import ConfigForm from "./ConfigForm";

export default function MacCard({ device, onStatusChange }) {
  const [showConfig, setShowConfig] = useState(false);

  const handleConfigSubmit = (formData) => {
    const updated = {
      ...device,
      ...formData,
      status: "Configured"
    };

    // Update localStorage
    const stored = JSON.parse(localStorage.getItem("scannedDevices")) || [];
    const updatedList = stored.map((d) =>
      d.mac === device.mac ? updated : d
    );
    localStorage.setItem("scannedDevices", JSON.stringify(updatedList));

    // Inform parent
    onStatusChange(device.mac, "Configured");

    setShowConfig(false);
  };

  return (
    <div className="bg-white shadow rounded-lg p-4 space-y-2">
      <div className="text-sm text-gray-700 font-semibold">
        MAC: <span className="text-black">{device.mac}</span>
      </div>
      <div className="text-sm text-gray-700">
        Status:{" "}
        <span
          className={
            device.status === "Configured"
              ? "text-green-600 font-semibold"
              : "text-yellow-600 font-semibold"
          }
        >
          {device.status}
        </span>
      </div>

      {device.status !== "Configured" && (
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
