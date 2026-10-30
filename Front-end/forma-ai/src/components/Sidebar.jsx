
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getSession, logoutUser } from "../utils/auth";
import "./Sidebar.css";

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const session = getSession();

  function handleLogout() {
    logoutUser();
    navigate("/login", { replace: true });
  }

  const isDashboard = location.pathname === "/dashboard";
  const isCreateForm = location.pathname === "/create-form";
  const isResponses = location.pathname === "/responses";

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">F</div>
        <h2>Forma AI</h2>
      </div>

      <p className="menu-label">WORKSPACE</p>

      <nav className="sidebar-nav">
        <Link
          to="/dashboard"
          className={`nav-link ${isDashboard ? "active" : ""}`}
        >
          <span>▦</span> Dashboard
        </Link>

        <Link
          to="/dashboard#forms"
          className={`nav-link ${
            isDashboard && location.hash === "#forms" ? "active" : ""
          }`}
        >
          <span>▤</span> My Forms
        </Link>

        <Link
          to="/create-form"
          className={`nav-link ${isCreateForm ? "active" : ""}`}
        >
          <span>＋</span> Create Form
        </Link>

        <Link to="/dashboard#drafts" className="nav-link">
          <span>◷</span> Saved Drafts
        </Link>

        <Link
          to="/responses"
          className={`nav-link ${isResponses ? "active" : ""}`}
        >
          <span>☷</span> Responses
        </Link>
      </nav>

      <div className="sidebar-bottom">
        <div className="profile">
          <div className="avatar">
            {session?.name?.charAt(0).toUpperCase() || "U"}
          </div>

          <div className="profile-details">
            <h4>{session?.name || "User"}</h4>
            <p>{session?.email || ""}</p>
          </div>
        </div>

        <button
          type="button"
          className="logout-button"
          onClick={handleLogout}
        >
          ↪ Logout
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
