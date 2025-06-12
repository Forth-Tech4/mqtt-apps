import React, { useState } from "react";
import axios from "axios";

export default function AddMacAddress() {
  const [macToAdd, setMacToAdd] = useState("");

  const handleAddMac = async () => {
    if (!macToAdd) return alert("Enter a MAC address");

    try {
      const res = await axios.post("http://localhost:3001/api/mac/add", { macaddress: macToAdd });
      if (res.data.status === "OX005") {
        alert("MAC added successfully.");
        setMacToAdd("");
      } else {
        alert(res.data.message + " (" + res.data.status + ")");
      }
    } catch (err) {
      const status = err.response?.data?.status;
      const message = err.response?.data?.message;

      if (status === "ERX006") {
        alert("This MAC already exists.");
      } else {
        alert("Error: " + message + " (" + status + ")");
      }
    }

  };

  return (
    <div className="bg-white shadow p-6 rounded w-full max-w-md mt-6">
      <h2 className="text-lg font-semibold mb-2">Add MAC Address</h2>
      <input
        placeholder="MAC address to add"
        value={macToAdd}
        onChange={(e) => setMacToAdd(e.target.value)}
        className="border p-2 w-full mb-2 rounded"
      />
      <button onClick={handleAddMac} className="bg-indigo-600 text-white w-full py-2 mt-2 rounded">
        Add MAC
      </button>
    </div>
  );
}
