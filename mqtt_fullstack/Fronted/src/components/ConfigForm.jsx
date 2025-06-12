import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function ConfigForm() {
  const query = useQuery();
  const mac = query.get("mac");

  const [form, setForm] = useState({
    common_name: "",
    ssid: "",
    password: ""
  });

  const handleSubmit = async () => {
    console.log("To be submitted:", { ...form, macaddress: mac });
    alert("Config submitted. (Functionality can be added here.)");
  };

  return (
    <div className="bg-white p-6 max-w-md mx-auto rounded shadow mt-10">
      <h2 className="text-xl font-bold mb-4">Configure Gimbal</h2>
      <p className="mb-2 text-gray-600">MAC: <span className="font-mono">{mac}</span></p>
      {["common_name", "ssid", "password"].map((field) => (
        <input
          key={field}
          type={field === "password" ? "password" : "text"}
          placeholder={field}
          value={form[field]}
          onChange={(e) => setForm({ ...form, [field]: e.target.value })}
          className="border p-2 mb-2 w-full rounded"
        />
      ))}
      <button onClick={handleSubmit} className="bg-blue-600 text-white w-full py-2 rounded mt-2">
        Submit Config
      </button>
    </div>
  );
}
