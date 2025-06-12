// Updated Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera } from "lucide-react";
import ScannerModal from "./ScannerModal";
import MacCard from "./MacCard";

export default function Dashboard() {
  const navigate = useNavigate();
  const [showScanner, setShowScanner] = useState(false);
  const [scannedList, setScannedList] = useState([]);

  const handleLogout = () => {
    localStorage.removeItem("userSession");
    localStorage.removeItem("rememberedUser");
    alert("You have been logged out.");
    navigate("/login");
  };

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("scannedDevices")) || [];
    setScannedList(saved);
  }, []);

  const handleNewScan = async (device) => {
    const isValid = await validateMac(device.mac);
    if (!isValid) return;

    const updatedList = [...scannedList, { ...device, status: "Unconfig" }];
    localStorage.setItem("scannedDevices", JSON.stringify(updatedList));
    setScannedList(updatedList);
  };

  const validateMac = async (mac) => {
    try {
      const res = await fetch("http://192.168.1.17:3001/api/mac/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ macaddress: mac })
      });
      const data = await res.json();
      if (data.status === "OX003") return true;
      if (data.status === "OX002") alert("MAC already configured.");
      else alert(data.message + " (" + data.status + ")");
      return false;
    } catch (err) {
      alert("MAC validation error");
      return false;
    }
  };

  const handleStatusUpdate = (mac, newStatus) => {
    const updated = scannedList.map((d) =>
      d.mac === mac ? { ...d, status: newStatus } : d
    );
    localStorage.setItem("scannedDevices", JSON.stringify(updated));
    setScannedList(updated);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold text-blue-800">Dashboard</h1>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow text-sm font-semibold"
          >
            Logout
          </button>
        </div>

        <div className="mb-6">
          <button
            onClick={() => setShowScanner(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md flex items-center gap-2 shadow"
          >
            <Camera className="w-4 h-4" />
            Scan Device QR
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {scannedList.map((device) => (
            <MacCard
              key={device.mac}
              device={device}
              onStatusChange={handleStatusUpdate}
            />
          ))}
        </div>
      </div>

      {showScanner && (
        <ScannerModal
          onClose={() => setShowScanner(false)}
          onScanSuccess={handleNewScan}
        />
      )}
    </div>
  );
}
