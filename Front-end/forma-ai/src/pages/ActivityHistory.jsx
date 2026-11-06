import { useCallback, useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { apiFetch } from "../utils/api";
import "./ActivityHistory.css";

const ACTIVITY_LABELS = {
  "form.created": {
    title: "Form created",
    description: "A new form was created.",
    icon: "+",
  },
  "form.updated": {
    title: "Form updated",
    description: "Form details were modified.",
    icon: "↻",
  },
  "form.published": {
    title: "Form published",
    description: "Your form is now available to respondents.",
    icon: "↗",
  },
  "form.unpublished": {
    title: "Form unpublished",
    description: "Your form is no longer publicly available.",
    icon: "◌",
  },
  "form.deleted": {
    title: "Form deleted",
    description: "A form was deleted.",
    icon: "×",
  },
  "submission.received": {
    title: "New response received",
    description: "Someone submitted a response to your form.",
    icon: "↓",
  },
};

function formatTimestamp(timestamp) {
  if (!timestamp) return "Time unavailable";

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) return "Time unavailable";

  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function ActivityHistory() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadActivities = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await apiFetch("/activities");

      if (!Array.isArray(data)) {
        throw new Error("Invalid activity data received from server.");
      }

      setActivities(data);
    } catch (err) {
      setError(err.message || "Unable to load activity history.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main activity-main">
        <Header />

        <section className="activity-heading">
          <div>
            <p className="activity-eyebrow">WORKSPACE HISTORY</p>
            <h1>Activity History</h1>
            <p>
              Track changes, form updates and responses across your workspace.
            </p>
          </div>

          <div className="activity-heading-actions">
            <button
              className="activity-refresh"
              type="button"
              onClick={loadActivities}
              disabled={loading}
            >
              <span aria-hidden="true">↻</span>
              {loading ? "Loading..." : "Refresh"}
            </button>

            <div className="activity-count">
              <span>Total Activities</span>
              <strong>{activities.length}</strong>
            </div>
          </div>
        </section>

        {loading ? (
          <section className="activity-state">
            <div className="activity-loader" />
            <h2>Loading activity</h2>
            <p>Fetching your latest workspace activity.</p>
          </section>
        ) : error ? (
          <section className="activity-state activity-error">
            <div className="activity-state-icon">!</div>
            <h2>Unable to load activities</h2>
            <p>{error}</p>
            <button
              className="activity-retry"
              type="button"
              onClick={loadActivities}
            >
              Try again
            </button>
          </section>
        ) : activities.length === 0 ? (
          <section className="activity-state">
            <div className="activity-state-icon">◷</div>
            <h2>No activity yet</h2>
            <p>
              Create a form, publish it or receive a response to start building
              your activity history.
            </p>
          </section>
        ) : (
          <section className="activity-list">
            {activities.map((activity) => {
              const config = ACTIVITY_LABELS[activity.action] || {
                title: activity.action || "Workspace activity",
                description: "An action was performed in your workspace.",
                icon: "•",
              };

              return (
                <article
                  className="activity-card"
                  key={activity._id}
                >
                  <div className="activity-icon" aria-hidden="true">
                    {config.icon}
                  </div>

                  <div className="activity-details">
                    <div className="activity-title-row">
                      <h3>{config.title}</h3>
                      <span className="activity-time">
                        {formatTimestamp(activity.createdAt)}
                      </span>
                    </div>

                    <p>{activity.formTitle || "Untitled Form"}</p>
                    <span className="activity-description">
                      {config.description}
                    </span>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}

export default ActivityHistory;