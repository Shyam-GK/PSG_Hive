import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./LoginForm.css";
import girlImg from "./girl.jpg";
import API_BASE_URL from "../../api";

const LoginForm = () => {
  const [username, setUsername] = useState(""); // actually email
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/auth/login`,
        {
          username,
          password,
        },
        { withCredentials: true } // Include cookies
      );

      if (res.data.success) {
        console.log("Login response:", res.data);
        console.log("Setting role:", res.data.user.role);
        setPopupType("success");
        setPopupMessage("Login successful!");

        // Store user data in localStorage for UI purposes
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("role", res.data.user.role);
        localStorage.setItem("userId", res.data.user.id);

        // Redirect based on role
        setTimeout(() => {
          setPopupMessage("");
          try {
            if (res.data.user.role === "admin") {
              navigate("/admin/dashboard", { replace: true });
            } else if (res.data.user.role === "faculty") {
              navigate("/faculty/dashboard", { replace: true });
            } else {
              navigate("/", { replace: true });
            }
          } catch (err) {
            console.error("Navigation error:", err);
            navigate("/login", { replace: true }); // Fallback
          }
        }, 1500);
      } else {
        setPopupType("error");
        setPopupMessage(`❌ ${res.data.message || "Invalid credentials"}`);
        setTimeout(() => setPopupMessage(""), 3000);
      }
    } catch (err) {
      const message = err.response?.data?.message || "Login failed";
      setPopupType("error");
      setPopupMessage(`❌ ${message}`);
      setTimeout(() => setPopupMessage(""), 3000);
      console.error("Login error:", err);
    }
  };

  return (
    <div className="login-page">
      {popupMessage && (
        <div className={`popup-notification ${popupType}`}>
          {popupMessage}
        </div>
      )}

      <div className="login-container">
        <div className="login-box">
          <div className="form-section">
            <h2>Login</h2>

            <label>Email Address</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your email"
            />

            <br />
            <br />

            <label>Password</label>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
            <br />
            <br />
            <div className="checkbox-row">
              <label className="checkbox-label">
                Show Password
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={() => setShowPassword(!showPassword)}
                />
              </label>
            </div>

            <div className="forgot-row">
              <button
                className="link-btn"
                type="button"
                onClick={() => {
                  console.log("Navigating to /forgot-password");
                  navigate("/forgot-password");
                }}
              >
                Forgot Password?
              </button>
            </div>

            <button className="login-btn" onClick={handleLogin}>
              Login
            </button>
          </div>

          <div className="image-section">
            <img src={girlImg} alt="login illustration" className="login-image" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;