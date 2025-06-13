// src/components/HomeRedirect.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function HomeRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("userSession") || localStorage.getItem("rememberedUser");

    if (isLoggedIn) {
      navigate("/dashboard");
    } else {
      navigate("/register");
    }
  }, [navigate]);

  return null; 
}
