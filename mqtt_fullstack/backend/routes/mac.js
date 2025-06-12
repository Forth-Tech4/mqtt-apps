const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');


router.post('/check', async (req, res) => {
  try {
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
      return res.status(404).json({ status: "ERX004", message: "MAC address not found", error: error?.message });
    }

    if (data.status === 'config') {
      return res.status(200).json({ status: "OX002", message: "Device already configured", data });
    }

    res.status(200).json({
      status: "OX003",
      message: "Device unconfigured",
      data: {
        macaddress: data.macaddress,
        status: data.status
      }
    });
  } catch (err) {
    res.status(500).json({ status: "ERX500", message: "Server error", error: err.message });
  }
});


router.post('/add', async (req, res) => {
  try {
    const { macaddress } = req.body;

    if (!macaddress) {
      return res.status(400).json({ status: "ERX003", message: "MAC address is required" });
    }

    // Check if MAC already exists
    const { data: existing, error: findErr } = await supabase
      .from('devicetable')
      .select('id')
      .eq('macaddress', macaddress)
      .single();

    if (existing) {
      return res.status(400).json({ status: "ERX002", message: "MAC address already exists" });
    }

    const { data, error } = await supabase
      .from('devicetable')
      .insert([{ macaddress, status: 'unconfig' }]);

    if (error) {
      return res.status(400).json({ status: "ERX500", message: "Insert failed", error: error.message });
    }

    res.status(200).json({ status: "OX004", message: "MAC address added successfully", data });
  } catch (err) {
    res.status(500).json({ status: "ERX500", message: "Server error", error: err.message });
  }
});

module.exports = router;
