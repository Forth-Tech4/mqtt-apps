import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function MacChecker() {
  const [mac, setMac] = useState("");
  const navigate = useNavigate();

  const handleMacCheck = async () => {
    try {
      const res = await axios.post("http://localhost:3001/api/mac/check", { macaddress: mac });
      if (res.data.status === "OX003") {
        alert("MAC is valid and unconfigured. Redirecting...");
        navigate(`/config?mac=${mac}`);
      } else if (res.data.status === "OX002") {
        alert("MAC is already configured.");
      } else {
        alert(res.data.message + " (" + res.data.status + ")");
      }

    } catch (err) {
      alert("Error: " + err.response?.data?.message + " (" + err.response?.data?.status + ")");
    }
  };

  return (
    <div className="bg-white shadow p-6 rounded w-full max-w-md mt-6">
      <h2 className="text-lg font-semibold mb-2">MAC Check</h2>
      <input
        placeholder="Enter MAC address"
        value={mac}
        onChange={(e) => setMac(e.target.value)}
        className="border p-2 w-full mb-2 rounded"
      />
      <button onClick={handleMacCheck} className="bg-green-600 text-white w-full py-2 mt-2 rounded">
        Check MAC
      </button>
    </div>
  );
}
