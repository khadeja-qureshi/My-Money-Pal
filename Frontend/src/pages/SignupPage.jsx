// src/pages/SignupPage.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const SECURITY_QUESTIONS = [
  { value: "favorite_color", label: "What is your favorite color?" },
  { value: "favorite_subject", label: "What is your favorite subject?" },
  { value: "favorite_movie", label: "What is your favorite movie?" },
];

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup, isLoading, error: authError } = useAuth();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    security_question: "favorite_color",
    security_answer: "",
  });

  const [localError, setLocalError] = useState(null);
  const [message, setMessage] = useState(null);

  const handleChange = (e) => {
    setLocalError(null);
    setMessage(null);
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    setMessage(null);

    try {
      const ok = await signup(form);
      if (ok) {
        navigate("/dashboard");
      } else {
        setLocalError("Signup failed. Please check your details.");
      }
    } catch (err) {
      console.error("Signup failed:", err);
      setLocalError("Signup failed. Please try again.");
    }
  };

  const errorMessage = localError || authError;

  return (
    <div className="auth-shell">
      <div className="auth-card">
        {/* Logo + Title */}
        <div className="auth-logo-box">
          <h1>Create Your Account</h1>
          <p className="auth-subtitle">
            Sign up to start tracking your income, expenses, and financial goals.
          </p>
        </div>

        <form className="stack-form" onSubmit={handleSubmit}>
          <label>
            Username
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              required
            />
          </label>

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

          <label>
            Security Question
            <select
              name="security_question"
              value={form.security_question}
              onChange={handleChange}
            >
              {SECURITY_QUESTIONS.map((q) => (
                <option key={q.value} value={q.value}>
                  {q.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Security Answer
            <input
              name="security_answer"
              value={form.security_answer}
              onChange={handleChange}
              required
            />
          </label>

          {errorMessage && <p className="error-text">{errorMessage}</p>}
          {message && <p className="success-text">{message}</p>}

          <button type="submit" disabled={isLoading}>
            {isLoading ? "Creating..." : "Sign Up"}
          </button>
        </form>

        <p className="auth-footer-text">
          Already have an account? <Link to="/login">Login instead</Link>
        </p>
      </div>
    </div>
  );
}
