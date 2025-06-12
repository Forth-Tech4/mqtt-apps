import React, { useState } from "react";

export default function ConfigForm({ device, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    wifiId: "",
    wifiPass: "",
    cn: "",
    ftp: ""
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.wifiId || !form.wifiPass || !form.cn || !form.ftp) {
      return alert("All fields are required");
    }

    onSubmit(form);
  };

  return (
    <div className="mt-4 p-4 border rounded-lg bg-gray-50">
      <h3 className="text-md font-bold mb-2 text-blue-800">Configure {device.mac}</h3>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          name="wifiId"
          placeholder="Your Wi-Fi SSID"
          value={form.wifiId}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        <input
          type="password"
          name="wifiPass"
          placeholder="Your Wi-Fi Password"
          value={form.wifiPass}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          name="cn"
          placeholder="Common Name (CN)"
          value={form.cn}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          name="ftp"
          placeholder="FTP Link"
          value={form.ftp}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />

        <div className="flex justify-end gap-2 mt-3">
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
}
