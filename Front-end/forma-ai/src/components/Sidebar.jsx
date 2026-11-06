
import { Link, useLocation } from "react-router-dom";
import "./Sidebar.css";

function Icon({ name, size = 19 }) {
  const commonProps = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  const paths = {
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
    forms: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M8 13h8M8 17h8" />
      </>
    ),
    create: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <path d="M12 8v8M8 12h8" />
      </>
    ),
    templates: (
      <>
        <rect x="3" y="3" width="8" height="8" rx="1.5" />
        <rect x="13" y="3" width="8" height="5" rx="1.5" />
        <rect x="13" y="10" width="8" height="11" rx="1.5" />
        <rect x="3" y="13" width="8" height="8" rx="1.5" />
      </>
    ),
    responses: (
      <>
        <path d="M4 4h16v16H4z" />
        <path d="m8 12 2.5 2.5L16 9" />
      </>
    ),
    activity: <path d="M3 12h4l3-8 4 16 3-8h4" />,
    nova: (
      <>
        <path d="m12 2 2.2 6.8L21 11l-6.8 2.2L12 20l-2.2-6.8L3 11l6.8-2.2L12 2Z" />
        <path d="m19 15 1.2 2.8L23 19l-2.8 1.2L19 23l-1.2-2.8L15 19l2.8-1.2L19 15Z" />
      </>
    ),
  };

  return <svg {...commonProps}>{paths[name]}</svg>;
}

function Sidebar() {
  const location = useLocation();

  const isDashboard = location.pathname === "/dashboard";
  const isMyForms = location.pathname === "/my-forms";
  const isCreateForm = location.pathname === "/create-form";
  const isTemplates = location.pathname === "/templates";
  const isResponses = location.pathname === "/responses";
  const isActivityHistory = location.pathname === "/activity-history";
  const isAssistant = location.pathname === "/assistant";

  return (
    <aside className="sidebar">
      <Link to="/dashboard" className="brand" aria-label="Forma AI Dashboard">
        <div className="brand-icon">F</div>
        <div className="brand-text">
          <h2>Forma AI</h2>
          <span>FORM BUILDER</span>
        </div>
      </Link>

      <div className="sidebar-navigation">
        <section className="sidebar-group">
          <p className="menu-label">WORKSPACE</p>

          <nav className="sidebar-nav">
            <Link
              to="/dashboard"
              className={`nav-link ${isDashboard ? "active" : ""}`}
            >
              <Icon name="dashboard" />
              <span>Dashboard</span>
            </Link>

            <Link
              to="/my-forms"
              className={`nav-link ${isMyForms ? "active" : ""}`}
            >
              <Icon name="forms" />
              <span>My Forms</span>
            </Link>

            <Link
              to="/create-form"
              className={`nav-link ${isCreateForm ? "active" : ""}`}
            >
              <Icon name="create" />
              <span>Create Form</span>
            </Link>

            <Link
              to="/templates"
              className={`nav-link ${isTemplates ? "active" : ""}`}
            >
              <Icon name="templates" />
              <span>Templates</span>
            </Link>

            <Link
              to="/responses"
              className={`nav-link ${isResponses ? "active" : ""}`}
            >
              <Icon name="responses" />
              <span>Responses</span>
            </Link>
          </nav>
        </section>

        <section className="sidebar-group">
          <p className="menu-label">AI &amp; INSIGHTS</p>

          <nav className="sidebar-nav">
            <Link
              to="/assistant"
              className={`nav-link ${isAssistant ? "active" : ""}`}
            >
              <Icon name="nova" />
              <span>NOVA AI</span>
              <span className="nav-link-badge">AI</span>
            </Link>

            <Link
              to="/activity-history"
              className={`nav-link ${isActivityHistory ? "active" : ""}`}
            >
              <Icon name="activity" />
              <span>Activity History</span>
            </Link>
          </nav>
        </section>
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-footer-mark">
          <span className="footer-mark-dot" />
          <span>Powered by Forma AI</span>
        </div>
        <p>Intelligent forms, simplified.</p>
      </div>
    </aside>
  );
}

export default Sidebar;