import { useEffect, useState } from "react";
import Sidebar from "../components/common/Sidebar";
import { getProfileAPI, updateProfileAPI } from "../api/profile";

export default function ProfilePage() {
  const [form, setForm] = useState({ username: "", email: "" });
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getProfileAPI();
        setForm(data);
      } catch {
        setError("Failed to load profile");
      }
    })();
  }, []);

  const handleChange = (e) => {
    setError(null);
    setMessage(null);
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateProfileAPI(form);
      setMessage("Profile updated");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update profile");
    }
  };

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-content">
        <div className="page-inner">
          <div className="page-header">
            <div>
              <h1 className="page-title">Profile</h1>
              <p className="page-subtitle">
                Update your account information used across My Money Pal.
              </p>
            </div>
          </div>

          <div className="profile-card panel">
            <div className="profile-header">
              <div className="profile-avatar">
                {form.username ? form.username.charAt(0).toUpperCase() : "U"}
              </div>
              <div>
                <h2 className="profile-name">{form.username || "Your name"}</h2>
                <p className="profile-email">{form.email || "your@email.com"}</p>
              </div>
            </div>

            <div className="profile-divider" />

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

              {error && <p className="error-text">{error}</p>}
              {message && <p className="success-text">{message}</p>}

              <button type="submit">Save changes</button>
            </form>
          </div>
        </div>

        <style>{`
          .page-subtitle {
            margin: 4px 0 0;
            font-size: 0.9rem;
            color: #6b7280;
          }

          .profile-card {
            max-width: 520px;
            margin-top: 1rem;
          }

          .profile-header {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1rem;
          }

          .profile-avatar {
            width: 48px;
            height: 48px;
            border-radius: 999px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #4f46e5, #6366f1);
            color: #f9fafb;
            font-weight: 700;
            font-size: 1.3rem;
          }

          .profile-name {
            margin: 0;
            font-size: 1.1rem;
            font-weight: 600;
          }

          .profile-email {
            margin: 2px 0 0;
            font-size: 0.85rem;
            color: #6b7280;
          }

          .profile-divider {
            height: 1px;
            background: #e5e7eb;
            margin: 0.5rem 0 1rem;
          }
        `}</style>
      </main>
    </div>
  );
}
