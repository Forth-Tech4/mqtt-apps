import React, { useEffect, useState } from "react";

export default function ConfigForm({ device, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    wifiId: "",
    wifiPass: "",
    cn: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ftpUrl, setFtpUrl] = useState("");

  useEffect(() => {
  const session = JSON.parse(localStorage.getItem("userSession"));
  if (session?.common_name) {
    setForm((prev) => ({ ...prev, cn: session.common_name }));
  }

  const fetchFtpPath = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/mac/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ macaddress: device.macaddress })
      });

      const data = await res.json();
      if (data?.ftp_path) {
        setForm((prev) => ({ ...prev, ftp: data.ftp_path }));
      }
    } catch {
      console.error("Failed to fetch FTP path");
    }
  };

  fetchFtpPath();
}, []);


  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.wifiId || !form.wifiPass || !form.cn) {
      return alert("⚠ Please fill in all required fields.");
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("http://localhost:3001/api/mac/configure-device", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          macaddress: device.macaddress,
          wifi_ssid: form.wifiId,
          wifi_password: form.wifiPass,
          common_name: form.cn
        })
      });

      const result = await response.json();

      if (result.success) {
        alert(`✅ Config Successful!
        SSID: ${form.wifiId}
        FTP: ${ftpUrl}`);
        onSubmit(form);
      } else {
        alert("❌ Config Failed: " + result.message);
      }

    } catch (err) {
      alert("❌ Network error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-4 p-4 border rounded-lg bg-gray-50">
      <h3 className="text-md font-bold mb-2 text-blue-800">
        Configure Device: {device.macaddress}
      </h3>

      <div className="mb-3 p-3 bg-blue-50 rounded border border-blue-200">
        <h4 className="font-semibold text-blue-800 mb-1">📱 Connection Steps:</h4>
        <ol className="text-sm text-blue-700 space-y-1">
          <li>1. Connect to the device hotspot</li>
          <li>2. <strong>SSID:</strong> {device.qr_ssid}</li>
          <li>3. <strong>Password:</strong> {device.qr_pass}</li>
          <li>4. Submit the form below</li>
        </ol>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Your WiFi SSID *
          </label>
          <input
            type="text"
            name="wifiId"
            placeholder="e.g. HomeWiFi"
            value={form.wifiId}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:border-blue-500"
            disabled={isSubmitting}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Your WiFi Password *
          </label>
          <input
            type="password"
            name="wifiPass"
            placeholder="Enter your WiFi password"
            value={form.wifiPass}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:border-blue-500"
            disabled={isSubmitting}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Common Name (CN) *
          </label>
          <input
            type="text"
            name="cn"
            placeholder="e.g. Kitchen Router"
            value={form.cn}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:border-blue-500"
            disabled={isSubmitting}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            FTP URL
          </label>
          <input
            type="text"
            value={ftpUrl}
            className="w-full p-2 border rounded bg-gray-100 text-gray-600"
            disabled
          />
          <p className="text-xs text-gray-500 mt-1">
            Auto-filled from database
          </p>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
            disabled={isSubmitting}
          >
            {isSubmitting ? "⏳ Configuring..." : "🚀 Configure Device"}
          </button>
        </div>
      </form>
    </div>
  );
}
