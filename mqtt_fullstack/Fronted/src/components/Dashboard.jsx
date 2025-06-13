// src/components/Dashboard.jsx
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
    alert("You have been logged out.");
    navigate("/login");
  };

  const fetchDevices = async () => {
    const session = JSON.parse(localStorage.getItem("userSession"));
    const userId = session?.id;
    if (!userId) return;

    try {
      const res = await fetch("http://localhost:3001/api/mac/by-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });

      const result = await res.json();
      setScannedList(result.devices || []);
    } catch (err) {
      console.error("❌ Fetch failed:", err);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const validateMac = async (mac) => {
    try {
      const res = await fetch("http://localhost:3001/api/mac/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ macaddress: mac }),
      });
      const data = await res.json();
      if (data.status === "OX003") return true;
      if (data.status === "OX002") alert("MAC already configured.");
      else alert(data.message);
      return false;
    } catch {
      alert("MAC validation failed");
      return false;
    }
  };

  const handleNewScan = async (device) => {
  const session = JSON.parse(localStorage.getItem("userSession"));
  const userId = session?.id;
  const loggedInCN = session?.common_name;

  if (!userId) return;

  const isValid = await validateMac(device.mac);
  if (!isValid) return;

 console.log("///////", device.cnname, loggedInCN);

if (device.cnname.trim().toLowerCase() !== loggedInCN.trim().toLowerCase()) {
  return alert("This device does not belong to your account (CN mismatch)");
}


  const alreadyShown = scannedList.find((d) => d.macaddress === device.mac);
  if (alreadyShown) {
    alert("Device already in dashboard");
    return;
  }

  try {
    const res = await fetch("http://localhost:3001/api/mac/assign-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        macaddress: device.mac,
        user_id: userId,
        ssid: device.ssid,
        pass: device.pass
      })
    });

    const result = await res.json();
    if (result.success) {
      const enriched = {
        macaddress: device.mac,
        qr_ssid: device.ssid,
        qr_pass: device.pass,
        status: result.status || "unconfig",
        ftp_path: result.ftp_path // 🔽 optional if backend returns this
      };
      setScannedList(prev => [...prev, enriched]);
    } else {
      alert(result.message);
    }
  } catch (err) {
    alert("Failed to assign MAC");
  }
};


  const handleStatusUpdate = (mac, newStatus) => {
    const updated = scannedList.map((d) =>
      d.macaddress === mac ? { ...d, status: newStatus } : d
    );
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

       <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 auto-rows-fr">

          {scannedList.map((device) => (
            <MacCard
              key={device.macaddress}
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
