// src/pages/LoginPage.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login, error: authError, isLoading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [localError, setLocalError] = useState(null);

  const handleChange = (e) => {
    setLocalError(null);
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    try {
      const ok = await login(form.email, form.password);
      if (ok) {
        navigate("/dashboard");
      } else {
        setLocalError("Invalid credentials");
      }
    } catch (err) {
      console.error("Login failed:", err);
      setLocalError("Login failed. Please try again.");
    }
  };

  const message = localError || authError;

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-logo-box">
          <h1>My Money Pal</h1>
          <p className="auth-subtitle">
            Sign in to view your dashboard and manage your finances.
          </p>
        </div>

        <form className="stack-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Password
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </label>

          {message && <p className="error-text">{message}</p>}

          <button type="submit" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="auth-footer-text">
          <span style={{ marginRight: 8 }}>
            <Link to="/signup">Create an account</Link>
          </span>
          <span>
            <Link to="/forgot-password">Forgot password?</Link>
          </span>
        </p>
      </div>
    </div>
  );
}
