const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');
const axios = require('axios');

// Check MAC status and return device info including FTP URL
router.post('/check', async (req, res) => {
  const { macaddress } = req.body;

  if (!macaddress) {
    return res.status(400).json({ status: "ERX003", message: "MAC address is required" });
  }

  const { data, error } = await supabase
    .from('devicetable')
    .select('*')
    .eq('macaddress', macaddress)
    .single();

  if (error || !data) {
    return res.status(404).json({ status: "ERX004", message: "MAC not found" });
  }

  if (data.status === 'config') {
    return res.status(200).json({
      status: "OX002",
      message: "Already configured",
      data: {
        ...data,
        ftp_url: data.ftp_url // Include FTP URL in response
      }
    });
  }

  res.status(200).json({
    status: "OX003",
    message: "MAC unconfigured",
    data: {
      ...data,
      ftp_url: data.ftp_url // Include FTP URL in response
    }
  });
});

// Assign MAC to user and save QR SSID/PASS
router.post('/assign-user', async (req, res) => {
  const { macaddress, user_id, ssid, pass } = req.body;

  if (!macaddress || !user_id || !ssid || !pass) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }

  const { data: existing } = await supabase
    .from("devicetable")
    .select("*")
    .eq("macaddress", macaddress)
    .single();

  if (!existing) return res.status(404).json({ success: false, message: "MAC not registered" });

  if (existing.user_id && existing.user_id !== user_id) {
    return res.status(400).json({ success: false, message: "MAC already assigned to another user" });
  }

  const { error } = await supabase
    .from("devicetable")
    .update({ user_id, qr_ssid: ssid, qr_pass: pass })
    .eq("macaddress", macaddress);

  if (error) return res.status(500).json({ success: false, message: error.message });

  res.status(200).json({
    success: true,
    message: "MAC assigned",
    status: existing.status,
    ftp_url: existing.ftp_url // Return FTP URL
  });
});

// Get all MACs for user (with FTP URLs)
router.post('/by-user', async (req, res) => {
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ status: "ERX008", message: "user_id required" });
  }

  const { data, error } = await supabase
    .from('devicetable')
    .select('*')
    .eq('user_id', user_id);

  if (error) return res.status(500).json({ status: "ERX009", message: error.message });

  res.status(200).json({ status: "OX010", devices: data });
});

// Configure device with WiFi credentials
router.post('/configure-device', async (req, res) => {
  const { macaddress, wifi_ssid, wifi_password, common_name } = req.body;

  if (!macaddress || !wifi_ssid || !wifi_password || !common_name) {
    return res.status(400).json({ success: false, message: "All fields required" });
  }

  try {
    // Fetch device info from DB
    const { data: device } = await supabase
      .from('devicetable')
      .select('*')
      .eq('macaddress', macaddress)
      .single();

    if (!device) {
      return res.status(404).json({ success: false, message: "Device not found" });
    }

    const ftp_url = device.ftp_url;

    const configData = {
      wifi_ssid,
      wifi_password,
      ftp_url,
      common_name,
      mac: macaddress
    };

    const deviceIP = "192.168.212.235:8080"; 

    let deviceResponse = null;

    try {
      const resFromDevice = await axios.post(`http://${deviceIP}/configure`, configData, {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' }
      });

      deviceResponse = resFromDevice.data;

    } catch (deviceError) {
      console.log("⚠️ Device communication failed:", deviceError.message);
      return res.status(500).json({
        success: false,
        message: "Device not reachable. Configuration not saved."
      });
    }

    if (!deviceResponse || !deviceResponse.success) {
      return res.status(500).json({
        success: false,
        message: "Device responded with failure. Not configured."
      });
    }

    // ✅ Only update if device confirmed config
    const { error } = await supabase
      .from('devicetable')
      .update({
        wifi_ssid,
        wifi_password,
        common_name,
        status: 'config'
      })
      .eq('macaddress', macaddress);

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    res.status(200).json({
      success: true,
      message: "✅ Device configured successfully",
      config_data: configData
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


// Get device info (including FTP URL)
router.post('/device-info', async (req, res) => {
  const { macaddress } = req.body;

  const { data, error } = await supabase
    .from('devicetable')
    .select('*')
    .eq('macaddress', macaddress)
    .single();

  if (error) return res.status(404).json({ success: false, message: "Device not found" });

  res.status(200).json({
    success: true,
    device: data,
    ftp_url: data.ftp_url
  });
});

// Update status
router.post('/update-status', async (req, res) => {
  const { macaddress, status } = req.body;

  const { error } = await supabase
    .from("devicetable")
    .update({ status })
    .eq("macaddress", macaddress);

  if (error) return res.status(500).json({ success: false, message: error.message });

  res.json({ success: true, message: "Status updated" });
});

module.exports = router;