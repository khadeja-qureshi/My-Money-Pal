// src/components/common/Sidebar.jsx
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";


export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();                    
    navigate("/login", { replace: true }); 
  };

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">

        <div>
          <h2 className="sidebar-title">My Money Pal</h2>
          <p className="sidebar-subtitle">Personal Finance Dashboard</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        <Link
          to="/dashboard"
          className={`sidebar-link ${isActive("/dashboard") ? "active" : ""}`}
        >
          Dashboard
        </Link>
        <Link
          to="/transactions"
          className={`sidebar-link ${isActive("/transactions") ? "active" : ""}`}
        >
          Transactions
        </Link>
        <Link
          to="/budget-goals"
          className={`sidebar-link ${
            isActive("/budget-goals") ? "active" : ""
          }`}
        >
          Budgets & Goals
        </Link>
        <Link
          to="/profile"
          className={`sidebar-link ${isActive("/profile") ? "active" : ""}`}
        >
          Profile
        </Link>
      </nav>

      <button className="sidebar-logout" onClick={handleLogout}>
        Logout
      </button>
    </aside>
  );
}
