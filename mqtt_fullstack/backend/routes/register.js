const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

router.post('/', async (req, res) => {
  try {
    const { fullname, email, mobile, common_name, password } = req.body;

    if (!fullname || !email || !common_name || !password) {
      return res.status(400).json({
        status: "ERX001",
        message: "Missing required fields: fullname, email, common_name, or password"
      });
    }

    const { data, error } = await supabase
      .from('usertable')
      .insert([{ fullname, email, mobile, common_name, password }]);

    if (error) {
      let detailedMessage = "Supabase insert error";

      // Check for duplicate entry or constraint violation
      if (error.code === '23505') {
        if (error.message.includes("email")) {
          detailedMessage = "Email already exists";
        } else if (error.message.includes("common_name")) {
          detailedMessage = "Common name already exists";
        } else {
          detailedMessage = "Duplicate entry detected";
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

  } catch (err) {
    return res.status(500).json({
      status: "ERX500",
      message: "Server error",
      error: err.message
    });
  }
});

module.exports = router;
