// src/pages/ForgotPasswordPage.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { resetPasswordAPI } from "../api/auth";

const SECURITY_QUESTIONS = [
  { value: "favorite_color", label: "What is your favorite color?" },
  { value: "favorite_subject", label: "What is your favorite subject?" },
  { value: "favorite_movie", label: "What is your favorite movie?" },
];

export default function ForgotPasswordPage() {
  const [form, setForm] = useState({
    email: "",
    security_question: "favorite_color",
    security_answer: "",
    new_password: "",
  });

  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setError(null);
    setMessage(null);
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const {
      email,
      security_question,
      security_answer,
      new_password,
    } = form;

    
    if (
      !email.trim() ||
      !security_question.trim() ||
      !security_answer.trim() ||
      !new_password.trim()
    ) {
      setError("All fields are required");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await resetPasswordAPI({
        email: email.trim(),
        security_question,
        security_answer: security_answer.trim(),
        new_password,
      });
      setMessage(res.message || "Password updated successfully.");
      
      setForm((prev) => ({
        ...prev,
        security_answer: "",
        new_password: "",
      }));
    } catch (err) {
      console.error("Reset password failed:", err);
      const msg =
        err?.response?.data?.error ||
        "Failed to reset password. Please check your details.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1 className="auth-title">Forgot Password</h1>
        <p className="auth-subtitle">
          Confirm your security question and answer to set a new password.
        </p>

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

          <label>
            New Password
            <input
              name="new_password"
              type="password"
              value={form.new_password}
              onChange={handleChange}
              required
            />
          </label>

          {error && <p className="error-text">{error}</p>}
          {message && <p className="success-text">{message}</p>}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <p className="auth-footer-text">
          <Link to="/login">Back to login</Link>
        </p>
      </div>
    </div>
  );
}
