const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

router.post('/', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      status: "ERX001",
      message: "Missing email or password",
    });
  }

  try {
    const { data, error } = await supabase
      .from("usertable")
      .select("*")
      .eq("email", email)
      .eq("password", password)

      .single();

    if (error || !data) {
      return res.status(401).json({
        status: "ERX002",
        message: "Invalid email or password",
      });
    }

    return res.status(200).json({
      status: "OX001",
      message: "Login successful",
      user: data,
    });
  } catch (err) {
    return res.status(500).json({
      status: "ERX500",
      message: "Server error",
      error: err.message,
    });
  }
});

module.exports = router;
