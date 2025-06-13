import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

export default function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const remembered = JSON.parse(localStorage.getItem("rememberedUser"));
        if (remembered?.email) {
            setEmail(remembered.email);
        }
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post("http://localhost:3001/api/login", {
                email,
                password,
            });

            if (res.data.status === "OX001") {
                if (rememberMe) {
                    localStorage.setItem("rememberedUser", JSON.stringify({ email }));
                }

                localStorage.setItem("userSession", JSON.stringify(res.data.user));
                // console.log("//////////////", res.data.user);
                navigate("/dashboard");
            } else {
                alert("Unexpected: " + res.data.message);
            }
        } catch (err) {
            const status = err.response?.data?.status;
            const message = err.response?.data?.message;

            if (status === "ERX002") {
                alert("Invalid email or password.");
            } else {
                alert("Login error: " + message);
            }
        }
    };

    return (
        <div className="w-full max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
            <h2 className="text-xl font-bold mb-4 text-center">Login</h2>
            <form onSubmit={handleLogin} className="space-y-4">
                <input
                    type="email"
                    placeholder="Email Address"
                    className="w-full p-2 border rounded"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Password"
                    className="w-full p-2 border rounded"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    Remember Me
                </label>

                <button className="bg-blue-600 hover:bg-blue-700 text-white w-full p-2 rounded">
                    Login
                </button>
            </form>

            <p className="mt-4 text-center text-sm text-blue-700">
                Already registered?{" "}
                <Link to="/register" className="text-blue-900 font-semibold hover:underline">
                    Register here
                </Link>
            </p>
        </div>
    );
}
