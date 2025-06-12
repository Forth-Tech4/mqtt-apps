// src/components/Dashboard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import MacChecker from "./MacChecker";
import AddMacAddress from "./AddMacAddress";

export default function Dashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("userSession");
    localStorage.removeItem("rememberedUser");
    alert("You have been logged out.");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center gap-6 p-4">
      <div className="w-full max-w-4xl flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-blue-800">Dashboard</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow text-sm font-semibold"
        >
          Logout
        </button>
      </div>
      <MacChecker />
      <AddMacAddress />
    </div>
  );
}
