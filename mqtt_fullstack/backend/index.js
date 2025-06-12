require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const supabase = require('./supabaseClient');
const registerRoutes = require('./routes/register');
const macRoutes = require('./routes/mac');

app.use(cors());
app.use(express.json());

app.use("/api/register", registerRoutes);
app.use("/api/mac", macRoutes);

app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({ status: "ERX500", message: "Internal Server Error" });
});

app.listen(3001, '0.0.0.0' ,() => {
  console.log("✅ Server running on http://0.0.0.0:3001");
});
