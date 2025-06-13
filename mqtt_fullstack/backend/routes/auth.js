const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

// 🔐 Register User
router.post('/register', async (req, res) => {
  const { fullname, email, mobile, common_name, password } = req.body;

  if (!fullname || !email || !common_name || !password) {
    return res.status(400).json({
      status: "ERX001",
      message: "Missing required fields"
    });
  }

  const { data, error } = await supabase
    .from('usertable')
    .insert([{ fullname, email, mobile, common_name, password }]);

  if (error) {
    let detailedMessage = "Supabase insert error";
    if (error.code === '23505') {
      if (error.message.includes("email")) {
        detailedMessage = "Email already exists";
      } else if (error.message.includes("common_name")) {
        detailedMessage = "Common name already exists";
      }
    }
    return res.status(400).json({
      status: "ERX002",
      message: detailedMessage,
      supabaseMessage: error.message
    });
  }

  return res.status(200).json({
    status: "OX001",
    message: "User registered successfully",
    data
  });
});

// 🔑 Login User
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ status: "ERX001", message: "Missing email or password" });
  }

  const { data, error } = await supabase
    .from("usertable")
    .select("*")
    .eq("email", email)
    .eq("password", password)
    .single();

  if (error || !data) {
    return res.status(401).json({ status: "ERX002", message: "Invalid email or password" });
  }

  res.status(200).json({ status: "OX001", message: "Login successful", user: data });
});

module.exports = router;
