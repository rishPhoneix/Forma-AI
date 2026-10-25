import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import "./ActivityHistory.css";

const ACTIVITY_KEY = "forma-ai-activity-history";

function ActivityHistory() {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    function loadActivities() {
      try {
        const data = JSON.parse(
          localStorage.getItem(ACTIVITY_KEY) || "[]"
        );

        setActivities(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Unable to load activities:", error);
        setActivities([]);
      }
    }

    loadActivities();
    window.addEventListener("storage", loadActivities);

    return () => {
      window.removeEventListener("storage", loadActivities);
    };
  }, []);

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main activity-main">
        <Header />

        <section className="activity-heading">
          <div>
            <p className="activity-eyebrow">WORKSPACE HISTORY</p>
            <h1>Activity History</h1>
            <p>Track changes and actions performed on your forms.</p>
          </div>

          <div className="activity-count">
            <span>Total Activities</span>
            <strong>{activities.length}</strong>
          </div>
        </section>

        {activities.length === 0 ? (
          <section className="activity-empty">
            <div className="activity-empty-icon">◷</div>
            <h2>No activity yet</h2>
            <p>
              Create a form, edit an existing form, or submit a preview
              to start building your activity history.
            </p>
          </section>
        ) : (
          <section className="activity-list">
            {activities.map((activity) => (
              <article className="activity-card" key={activity.id}>
                <div className="activity-icon">✓</div>

                <div className="activity-details">
                  <h3>{activity.action}</h3>
                  <p>{activity.formTitle || "Untitled Form"}</p>
                  <span>
                    {activity.timestamp
                      ? new Date(activity.timestamp).toLocaleString()
                      : "Time unavailable"}
                  </span>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

export default ActivityHistory;