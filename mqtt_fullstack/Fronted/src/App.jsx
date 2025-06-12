import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RegisterForm from "./components/RegisterForm";
import MacChecker from "./components/MacChecker";
import AddMacAddress from "./components/AddMacAddress";
import ConfigForm from "./components/ConfigForm"; // ✅ Make sure this file exists

function App() {
  return (
    <Router>
      <Routes>
        {/* Home Page with Register, MAC Check, Add MAC */}
        <Route
          path="/"
          element={
            <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center gap-6 p-4">
              <RegisterForm onSuccess={() => console.log("Registered!")} />
              <MacChecker />
              <AddMacAddress />
            </div>
          }
        />

        {/* Config Page after MAC check */}
        <Route
          path="/config"
          element={
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
              <ConfigForm />
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
