import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getSession, logoutUser } from "../utils/auth";
import { useTheme } from "../context/ThemeContext";
import "./Header.css";

function HeaderIcon({ name, size = 18 }) {
  const paths = {
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
      </>
    ),
    moon: (
      <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" />
    ),
    monitor: (
      <>
        <rect x="3" y="4" width="18" height="13" rx="2" />
        <path d="M8 21h8m-4-4v4" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    logout: (
      <>
        <path d="M10 17l5-5-5-5m5 5H3" />
        <path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
      </>
    ),
    chevron: <path d="m7 10 5 5 5-5" />,
    check: <path d="m5 12 4 4L19 6" />,
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const session = getSession();

  const [themeOpen, setThemeOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const pageTitles = {
    "/dashboard": "Dashboard",
    "/create-form": "Form Builder",
    "/responses": "Responses",
    "/activity-history": "Activity History",
    "/assistant": "NOVA AI",
  };

  const currentPage =
    pageTitles[location.pathname] || "Forma AI Workspace";

  const displayName = session?.name || "Account";
  const displayEmail = session?.email || "";

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

  function handleLogout() {
    logoutUser();
    navigate("/login", { replace: true });
  }

  function selectTheme(value) {
    setTheme(value);
    setThemeOpen(false);
  }

  return (
    <header className="dashboard-header">
      <div className="header-title">
        <p className="header-eyebrow">YOUR WORKSPACE</p>
        <h1>{currentPage}</h1>
      </div>

      <div className="header-actions">
        <div className="header-control-wrapper">
          <button
            type="button"
            className="header-icon-button"
            aria-label="Change appearance"
            aria-expanded={themeOpen}
            title="Appearance"
            onClick={() => {
              setThemeOpen((open) => !open);
              setProfileOpen(false);
            }}
          >
            <HeaderIcon
              name={
                theme === "light"
                  ? "sun"
                  : theme === "dark"
                    ? "moon"
                    : "monitor"
              }
            />
          </button>

          {themeOpen && (
            <div className="header-dropdown theme-dropdown">
              <p className="dropdown-heading">Appearance</p>

              {[
                { value: "light", label: "Light", icon: "sun" },
                { value: "dark", label: "Dark", icon: "moon" },
                { value: "system", label: "System", icon: "monitor" },
              ].map((option) => (
                <button
                  type="button"
                  className="dropdown-option"
                  key={option.value}
                  onClick={() => selectTheme(option.value)}
                >
                  <HeaderIcon name={option.icon} size={16} />
                  <span>{option.label}</span>

                  {theme === option.value && (
                    <HeaderIcon name="check" size={16} />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          className="header-icon-button"
          aria-label="Open activity history"
          title="Activity history"
          onClick={() => navigate("/activity-history")}
        >
          <HeaderIcon name="bell" />
        </button>

        <div className="header-control-wrapper">
          <button
            type="button"
            className={`header-profile-button ${
              profileOpen ? "is-open" : ""
            }`}
            aria-expanded={profileOpen}
            aria-label="Open account menu"
            onClick={() => {
              setProfileOpen((open) => !open);
              setThemeOpen(false);
            }}
          >
            <span className="header-avatar">{initials || "A"}</span>
            <span className="header-profile-name">{displayName}</span>
            <HeaderIcon name="chevron" size={15} />
          </button>

          {profileOpen && (
            <div className="header-dropdown profile-dropdown">
              <div className="profile-dropdown-info">
                <span className="header-avatar profile-dropdown-avatar">
                  {initials || "A"}
                </span>

                <div>
                  <strong>{displayName}</strong>
                  <span>{displayEmail}</span>
                </div>
              </div>

              <div className="dropdown-divider" />

              <button
                type="button"
                className="dropdown-option logout-option"
                onClick={handleLogout}
              >
                <HeaderIcon name="logout" size={16} />
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;