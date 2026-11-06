import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { apiFetch } from "../utils/api";
import { fetchForms } from "../utils/formsApi";
import "./Dashboard.css";

const STORAGE_KEY = "forma-ai-saved-forms";
const RESPONSES_KEY = "forma-ai-form-responses";

const ACTIVITY_LABELS = {
  "form.created": { title: "Form created", icon: "+" },
  "form.updated": { title: "Form updated", icon: "↻" },
  "form.published": { title: "Form published", icon: "↗" },
  "form.unpublished": { title: "Form unpublished", icon: "◌" },
  "form.deleted": { title: "Form deleted", icon: "×" },
  "submission.received": { title: "New response received", icon: "↓" },
};

function DashboardIcon({ name, size = 20 }) {
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

  const icons = {
    forms: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </>
    ),
    saved: (
      <path d="M5 3h14a2 2 0 0 1 2 2v16l-9-5-9 5V5a2 2 0 0 1 2-2Z" />
    ),
    fields: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M8 9h8M8 13h5M16 16h.01" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
    sparkle: (
      <>
        <path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-2-5.8L4 11l6-2.2L12 3Z" />
        <path d="m19 14 1 2.5 2 1-2 1-1 2.5-1-2.5-2-1 2-1 1-2.5Z" />
      </>
    ),
    document: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6M8 13h8M8 17h8" />
      </>
    ),
    template: (
      <>
        <rect x="3" y="3" width="8" height="8" rx="2" />
        <rect x="13" y="3" width="8" height="8" rx="2" />
        <rect x="3" y="13" width="8" height="8" rx="2" />
        <rect x="13" y="13" width="8" height="8" rx="2" />
      </>
    ),
    response: (
      <>
        <path d="M4 5h16v12H8l-4 4V5Z" />
        <path d="M8 9h8M8 13h5" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
  };

  return <svg {...commonProps}>{icons[name]}</svg>;
}

function formatTimestamp(timestamp) {
  if (!timestamp) return null;

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) return null;

  return {
    date: date.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    time: date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }),
  };
}

function Dashboard() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [savedForms, setSavedForms] = useState([]);
  const [responses, setResponses] = useState([]);
  const [serverForms, setServerForms] = useState([]);
  const [serverStatus, setServerStatus] = useState("loading");
  const [activities, setActivities] = useState([]);
  const [activityStatus, setActivityStatus] = useState("loading");

  const loadLocalData = useCallback(() => {
    try {
      const storedForms = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
      );
      const storedResponses = JSON.parse(
        localStorage.getItem(RESPONSES_KEY) || "[]"
      );

      setSavedForms(Array.isArray(storedForms) ? storedForms : []);
      setResponses(Array.isArray(storedResponses) ? storedResponses : []);
    } catch (error) {
      console.error("Unable to load dashboard data:", error);
      setSavedForms([]);
      setResponses([]);
    }
  }, []);

  const loadActivities = useCallback(async () => {
    setActivityStatus("loading");

    try {
      const data = await apiFetch("/activities");

      if (!Array.isArray(data)) {
        throw new Error("Invalid activity data received from server.");
      }

      setActivities(data);
      setActivityStatus("ready");
    } catch (error) {
      console.error("Unable to load dashboard activities:", error);
      setActivityStatus("error");
    }
  }, []);

  useEffect(() => {
    loadLocalData();
    window.addEventListener("storage", loadLocalData);

    return () => {
      window.removeEventListener("storage", loadLocalData);
    };
  }, [loadLocalData]);

  useEffect(() => {
    let cancelled = false;

    fetchForms()
      .then((data) => {
        if (cancelled) return;

        setServerForms(Array.isArray(data) ? data : []);
        setServerStatus("ready");
      })
      .catch((error) => {
        if (cancelled) return;

        console.error("Unable to load server forms:", error);
        setServerStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const userForms = savedForms.map((form) => ({
    ...form,
    category: "MY FORM",
    fields: Array.isArray(form.fields) ? form.fields.length : 0,
    isSavedForm: true,
  }));

  const templateForms = serverForms.map((form) => ({
    id: form.formId,
    title: form.title,
    description: form.description || "Ready-made form from the server.",
    category: "TEMPLATE",
    fields: null,
    isSavedForm: false,
    isServerForm: true,
  }));

  const allForms = [...userForms, ...templateForms];

  const filteredForms = allForms.filter((form) =>
    (form.title || "").toLowerCase().includes(search.toLowerCase().trim())
  );

  const totalFields = savedForms.reduce(
    (total, form) =>
      total + (Array.isArray(form.fields) ? form.fields.length : 0),
    0
  );

  const responseOverview = useMemo(() => {
    const responseFormIds = new Set();

    responses.forEach((response) => {
      const formId = response.formId ?? response.form?.id;

      if (formId !== undefined && formId !== null) {
        responseFormIds.add(String(formId));
      }
    });

    const latestResponse = responses.reduce((latest, response) => {
      const timestamp =
        response.updatedAt ||
        response.submittedAt ||
        response.createdAt ||
        response.date;

      if (!timestamp || Number.isNaN(new Date(timestamp).getTime())) {
        return latest;
      }

      if (
        !latest ||
        new Date(timestamp).getTime() > new Date(latest).getTime()
      ) {
        return timestamp;
      }

      return latest;
    }, null);

    return {
      total: responses.length,
      formsWithResponses: responseFormIds.size,
      latestResponse: formatTimestamp(latestResponse),
    };
  }, [responses]);

  function handleCreateForm() {
    navigate("/create-form");
  }

  function handleEditForm(form) {
    if (!form.isSavedForm) {
      alert("Template forms cannot be edited yet.");
      return;
    }

    navigate(`/create-form?edit=${encodeURIComponent(form.id)}`);
  }

  function handleFillForm(form) {
    const query = form.isServerForm ? "?source=server" : "";
    navigate(`/fill-form/${encodeURIComponent(form.id)}${query}`);
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <Header />

        <section className="welcome-section">
          <div className="welcome-content">
            <p className="welcome-label">YOUR WORKSPACE</p>
            <h2>Welcome to Forma AI!</h2>
            <p className="welcome-description">
              Your forms, responses and workspace activity in one place.
            </p>
          </div>

          <button
            type="button"
            className="create-form-button"
            onClick={handleCreateForm}
          >
            <DashboardIcon name="plus" size={18} />
            <span>Create Form</span>
          </button>
        </section>

        <section className="stats-grid" aria-label="Workspace statistics">
          <article className="stat-card">
            <div className="stat-icon">
              <DashboardIcon name="forms" size={20} />
            </div>
            <div>
              <p>Total Forms</p>
              <h3>{allForms.length}</h3>
              <span>Saved forms and templates</span>
            </div>
          </article>

          <article className="stat-card">
            <div className="stat-icon">
              <DashboardIcon name="saved" size={20} />
            </div>
            <div>
              <p>My Saved Forms</p>
              <h3>{savedForms.length}</h3>
              <span>Your created forms</span>
            </div>
          </article>

          <article className="stat-card">
            <div className="stat-icon">
              <DashboardIcon name="fields" size={20} />
            </div>
            <div>
              <p>Total Fields</p>
              <h3>{totalFields}</h3>
              <span>Fields in your saved forms</span>
            </div>
          </article>

          <article className="stat-card">
            <div className="stat-icon">
              <DashboardIcon name="response" size={20} />
            </div>
            <div>
              <p>Total Responses</p>
              <h3>{responses.length}</h3>
              <span>Submissions stored on this device</span>
            </div>
          </article>
        </section>

        <section className="quick-actions-section">
          <div className="dashboard-section-heading">
            <div>
              <p className="section-eyebrow">GET STARTED</p>
              <h2>Quick Actions</h2>
            </div>
          </div>

          <div className="quick-actions-grid">
            <button
              type="button"
              className="quick-action-card"
              onClick={handleCreateForm}
            >
              <span className="quick-action-icon">
                <DashboardIcon name="plus" size={21} />
              </span>
              <span className="quick-action-copy">
                <strong>Create Form</strong>
                <small>Build a new form</small>
              </span>
              <DashboardIcon name="arrow" size={17} />
            </button>

            <button
              type="button"
              className="quick-action-card"
              onClick={() => navigate("/assistant")}
            >
              <span className="quick-action-icon">
                <DashboardIcon name="sparkle" size={21} />
              </span>
              <span className="quick-action-copy">
                <strong>Ask NOVA</strong>
                <small>Explore your AI assistant</small>
              </span>
              <DashboardIcon name="arrow" size={17} />
            </button>

            <button
              type="button"
              className="quick-action-card"
              onClick={() => navigate("/templates")}
            >
              <span className="quick-action-icon">
                <DashboardIcon name="template" size={21} />
              </span>
              <span className="quick-action-copy">
                <strong>Browse Templates</strong>
                <small>Start with a ready-made form</small>
              </span>
              <DashboardIcon name="arrow" size={17} />
            </button>
          </div>
        </section>

        <section className="dashboard-content-grid">
          <div className="dashboard-panel forms-panel" id="forms">
            <div className="panel-heading">
              <div>
                <p className="section-eyebrow">FORM MANAGEMENT</p>
                <h2>My Forms</h2>
                <p>Manage your forms and open them to collect responses.</p>
              </div>

              <div className="forms-panel-tools">
                <label className="search-wrapper">
                  <DashboardIcon name="search" size={17} />
                  <input
                    type="search"
                    className="form-search"
                    placeholder="Search forms..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    aria-label="Search forms"
                  />
                </label>

                <button
                  type="button"
                  className="panel-text-button"
                  onClick={() => navigate("/my-forms")}
                >
                  View all
                  <DashboardIcon name="arrow" size={14} />
                </button>
              </div>
            </div>

            {serverStatus === "error" && (
              <p className="dashboard-inline-error" role="alert">
                Couldn't load server templates. Check that the backend is running.
              </p>
            )}

            {serverStatus === "loading" && savedForms.length === 0 ? (
              <div className="dashboard-empty-message">
                Loading your forms...
              </div>
            ) : filteredForms.length > 0 ? (
              <div className="dashboard-form-list">
                {filteredForms.slice(0, 5).map((form) => (
                  <article
                    className="dashboard-form-row"
                    key={`${form.isServerForm ? "server" : "local"}-${form.id}`}
                  >
                    <div className="dashboard-form-icon">
                      <DashboardIcon name="document" size={19} />
                    </div>

                    <div className="dashboard-form-info">
                      <div className="dashboard-form-title-row">
                        <h3>{form.title}</h3>
                        <span className="form-category">{form.category}</span>
                      </div>
                      <p>{form.description}</p>
                      <span className="dashboard-form-meta">
                        {form.fields === null
                          ? "Server template"
                          : `${form.fields} fields`}
                      </span>
                    </div>

                    <div className="dashboard-form-actions">
                      {form.isSavedForm && (
                        <button
                          type="button"
                          className="form-row-secondary"
                          onClick={() => handleEditForm(form)}
                        >
                          Edit
                        </button>
                      )}
                      <button
                        type="button"
                        className="form-row-primary"
                        onClick={() => handleFillForm(form)}
                      >
                        Fill
                        <DashboardIcon name="arrow" size={14} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="dashboard-empty-message">
                <DashboardIcon name="search" size={25} />
                <h3>No forms found</h3>
                <p>
                  {search
                    ? "Try another search term."
                    : "Create your first form or browse the templates."}
                </p>
                <button
                  type="button"
                  className="empty-state-button"
                  onClick={handleCreateForm}
                >
                  Create Form
                </button>
              </div>
            )}

            {filteredForms.length > 5 && (
              <button
                type="button"
                className="panel-footer-link"
                onClick={() => navigate("/my-forms")}
              >
                View all {filteredForms.length} forms
                <DashboardIcon name="arrow" size={14} />
              </button>
            )}
          </div>

          <div className="dashboard-panel activity-panel">
            <div className="panel-heading">
              <div>
                <p className="section-eyebrow">WORKSPACE HISTORY</p>
                <h2>Recent Activity</h2>
                <p>Your latest workspace events.</p>
              </div>

              <button
                type="button"
                className="panel-text-button"
                onClick={() => navigate("/activity-history")}
              >
                View all
                <DashboardIcon name="arrow" size={14} />
              </button>
            </div>

            {activityStatus === "loading" ? (
              <div className="dashboard-empty-message">
                Loading activity...
              </div>
            ) : activityStatus === "error" ? (
              <div className="dashboard-empty-message">
                <p>Unable to load recent activity.</p>
                <button
                  type="button"
                  className="panel-text-button"
                  onClick={loadActivities}
                >
                  Try again
                </button>
              </div>
            ) : activities.length === 0 ? (
              <div className="dashboard-empty-message">
                <DashboardIcon name="clock" size={25} />
                <h3>No activity yet</h3>
                <p>Your workspace events will appear here.</p>
              </div>
            ) : (
              <div className="recent-activity-list">
                {activities.slice(0, 5).map((activity) => {
                  const config = ACTIVITY_LABELS[activity.action] || {
                    title: activity.action || "Workspace activity",
                    icon: "•",
                  };

                  return (
                    <article
                      className="recent-activity-item"
                      key={activity._id}
                    >
                      <span className="recent-activity-icon">
                        {config.icon}
                      </span>
                      <div className="recent-activity-info">
                        <h3>{config.title}</h3>
                        <p>{activity.formTitle || "Untitled Form"}</p>
                        <span>{formatTimestamp(activity.createdAt)?.date || "Time unavailable"}</span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="dashboard-panel response-overview">
          <div className="panel-heading">
            <div>
              <p className="section-eyebrow">SUBMISSION INSIGHTS</p>
              <h2>Response Overview</h2>
              <p>A snapshot of responses saved in this browser.</p>
            </div>

            <button
              type="button"
              className="panel-text-button"
              onClick={() => navigate("/responses")}
            >
              View responses
              <DashboardIcon name="arrow" size={14} />
            </button>
          </div>

          <div className="response-overview-grid">
            <div className="response-overview-item">
              <span>Total Submissions</span>
              <strong>{responseOverview.total}</strong>
            </div>

            <div className="response-overview-item">
              <span>Forms With Responses</span>
              <strong>{responseOverview.formsWithResponses}</strong>
            </div>

            <div className="response-overview-item">
              <span>Latest Submission</span>
              {responseOverview.latestResponse ? (
                <div className="response-latest">
                  <strong>{responseOverview.latestResponse.date}</strong>
                  <span>{responseOverview.latestResponse.time}</span>
                </div>
              ) : (
                <strong className="response-latest-empty">
                  No submissions yet
                </strong>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;