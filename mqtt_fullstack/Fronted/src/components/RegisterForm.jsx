import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

export default function RegisterForm() {
  const [form, setForm] = useState({
    fullname: "", email: "", mobile: "", common_name: "", password: "", rememberMe: false,
  });

  const navigate = useNavigate();

  const handleRegister = async () => {
    try {
      const { rememberMe, ...formData } = form;
      const res = await axios.post("http://localhost:3001/api/register", formData);
      if (res.data.status === "OX001") {
        alert("Registration successful!");

        if (rememberMe) {
          localStorage.setItem("rememberedUser", JSON.stringify({ email: form.email }));
        }

        navigate("/login");
      } else {
        alert("Unexpected: " + res.data.message + " (" + res.data.status + ")");
      }
    } catch (err) {
      const status = err.response?.data?.status;
      const message = err.response?.data?.message;

      if (status === "ERX002") {
        alert("Duplicate email or username. Please try another.");
      } else {
        alert("Error: " + message + " (" + status + ")");
      }
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-blue-200 shadow-xl p-8 rounded-2xl w-full max-w-md mx-auto mt-10 border border-blue-100">
      <h2 className="text-2xl font-extrabold mb-6 text-blue-800 text-center tracking-tight">
        Create Your Account
      </h2>
      <form
        onSubmit={e => {
          e.preventDefault();
          handleRegister();
        }}
        className="space-y-4"
      >
        {[{ key: "fullname", label: "Full Name", type: "text" },
          { key: "email", label: "Email Address", type: "email" },
          { key: "mobile", label: "Mobile Number", type: "tel" },
          { key: "common_name", label: "Username", type: "text" },
          { key: "password", label: "Password", type: "password" }
        ].map(({ key, label, type }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-blue-700 mb-1" htmlFor={key}>
              {label}
            </label>
            <input
              id={key}
              type={type}
              placeholder={label}
              value={form[key]}
              onChange={e => setForm({ ...form, [key]: e.target.value })}
              className="border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-2 w-full rounded-lg transition outline-none bg-white"
              autoComplete={key}
              required
            />
          </div>
        ))}



        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 transition text-white w-full py-2 rounded-lg font-semibold shadow mt-4"
        >
          Register
        </button>
      </form>

      {/* ✅ Login Link */}
      <p className="mt-4 text-center text-sm text-blue-700">
        Already registered?{" "}
        <Link to="/login" className="text-blue-900 font-semibold hover:underline">
          Login here
        </Link>
      </p>
    </div>
  );
}
