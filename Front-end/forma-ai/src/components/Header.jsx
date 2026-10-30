import "./Header.css";

function Header() {
  return (
    <header className="dashboard-header">
      <div>
        <p className="header-eyebrow">WORKSPACE</p>
        <h1>Dashboard</h1>
      </div>

      <div className="header-status">
        <span className="status-dot"></span>
        AI Form Workspace
      </div>
    </header>
  );
}

export default Header;