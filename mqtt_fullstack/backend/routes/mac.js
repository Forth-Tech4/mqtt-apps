const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

// Check MAC status
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
    return res.status(200).json({ status: "OX002", message: "Already configured", data });
  }

  res.status(200).json({ status: "OX003", message: "MAC unconfigured", data });
});

//  Add MAC (if needed for testing)
router.post('/add', async (req, res) => {
  const { macaddress, user_id } = req.body;

  if (!macaddress || !user_id) {
    return res.status(400).json({ status: "ERX003", message: "MAC address and user_id are required" });
  }

  const { data: existing } = await supabase
    .from('devicetable')
    .select('id')
    .eq('macaddress', macaddress)
    .single();

  if (existing) {
    return res.status(400).json({ status: "ERX002", message: "MAC already exists" });
  }

  const { data, error } = await supabase
    .from('devicetable')
    .insert([{ macaddress, user_id, status: 'unconfig' }]);

  if (error) {
    return res.status(400).json({ status: "ERX500", message: "Insert failed", error: error.message });
  }

  res.status(200).json({ status: "OX004", message: "MAC added", data });
});

//  Assign MAC to user and save QR SSID/PASS
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

  res.status(200).json({ success: true, message: "MAC assigned", status: existing.status });
});

//  Get all MACs for user
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

//  Update MAC config status
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
