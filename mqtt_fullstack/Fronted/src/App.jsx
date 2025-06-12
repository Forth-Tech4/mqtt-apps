import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RegisterForm from "./components/RegisterForm";
import ConfigForm from "./components/ConfigForm";
import LoginForm from "./components/LoginForm";
import Dashboard from "./components/Dashboard";
import HomeRedirect from "./components/HomeRedirect"; // ✅ Import this

function App() {
  return (
    <Router>
      <Routes>
        {/* Redirect Logic */}
        <Route path="/" element={<HomeRedirect />} />

        {/* Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Config Page */}
        <Route
          path="/config"
          element={
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
              <ConfigForm />
            </div>
          }
        />

        {/* Login */}
        <Route
          path="/login"
          element={
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
              <LoginForm />
            </div>
          }
        />

        {/* Register */}
        <Route
          path="/register"
          element={
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
              <RegisterForm />
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
