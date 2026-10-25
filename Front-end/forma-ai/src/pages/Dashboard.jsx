
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import "./Dashboard.css";

const STORAGE_KEY = "forma-ai-saved-forms";

const sampleForms = [
  {
    id: "sample-insurance",
    title: "Insurance Claim Form",
    description: "Collect insurance claim details from users.",
    category: "INSURANCE",
    fields: 8,
    isSavedForm: false,
  },
  {
    id: "sample-healthcare",
    title: "Healthcare Registration",
    description: "Collect patient registration information.",
    category: "HEALTHCARE",
    fields: 6,
    isSavedForm: false,
  },
  {
    id: "sample-student",
    title: "Student Registration",
    description: "Collect student and academic information.",
    category: "EDUCATION",
    fields: 7,
    isSavedForm: false,
  },
];

function Dashboard() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [savedForms, setSavedForms] = useState([]);

  useEffect(() => {
    function loadSavedForms() {
      try {
        const stored = JSON.parse(
          localStorage.getItem(STORAGE_KEY) || "[]"
        );

        setSavedForms(Array.isArray(stored) ? stored : []);
      } catch (error) {
        console.error("Unable to load saved forms:", error);
        setSavedForms([]);
      }
    }

    loadSavedForms();

    window.addEventListener("storage", loadSavedForms);

    return () => {
      window.removeEventListener("storage", loadSavedForms);
    };
  }, []);

  const userForms = savedForms.map((form) => ({
    ...form,
    category: "MY FORM",
    fields: Array.isArray(form.fields) ? form.fields.length : 0,
    isSavedForm: true,
  }));

  const allForms = [...userForms, ...sampleForms];

  const filteredForms = allForms.filter((form) =>
    (form.title || "").toLowerCase().includes(search.toLowerCase())
  );

  function handleCreateForm() {
    navigate("/create-form");
  }

  function handleEditForm(form) {
    if (!form.isSavedForm) {
      alert("Sample forms cannot be edited yet.");
      return;
    }

    navigate(`/create-form?edit=${encodeURIComponent(form.id)}`);
  }

  function handleFillForm(form) {
    if (!form.isSavedForm) {
      alert(
        "This is a sample form. Create and save your own form to test submissions."
      );
      return;
    }

    navigate(`/fill-form/${encodeURIComponent(form.id)}`);
  }

  const totalFields = savedForms.reduce(
    (total, form) =>
      total +
      (Array.isArray(form.fields) ? form.fields.length : 0),
    0
  );

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <Header />

        <section className="welcome-section">
          <div>
            <p className="welcome-label">YOUR WORKSPACE</p>
            <h2>Welcome to Forma AI!</h2>
            <p>
              Create dynamic forms and manage your saved forms
              from one place.
            </p>
          </div>

          <button
            type="button"
            className="create-form-button"
            onClick={handleCreateForm}
          >
            + Create Form
          </button>
        </section>

        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon purple">▤</div>
            <p>Total Forms</p>
            <h3>{allForms.length}</h3>
            <span>Saved forms and sample forms</span>
          </div>

          <div className="stat-card">
            <div className="stat-icon green">✓</div>
            <p>My Saved Forms</p>
            <h3>{savedForms.length}</h3>
            <span>Your created forms</span>
          </div>

          <div className="stat-card">
            <div className="stat-icon orange">◷</div>
            <p>Total Fields</p>
            <h3>{totalFields}</h3>
            <span>Fields in your saved forms</span>
          </div>
        </section>

        <section className="forms-section" id="forms">
          <div className="section-heading">
            <div>
              <h2>My Forms</h2>
              <p>
                Edit your forms or open them to fill in responses.
              </p>
            </div>

            <input
              type="search"
              className="form-search"
              placeholder="Search forms..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search forms"
            />
          </div>

          <div className="forms-grid">
            {filteredForms.map((form) => (
              <article className="form-card" key={form.id}>
                <div className="form-card-top">
                  <span className="form-category">
                    {form.category}
                  </span>

                  <span className="form-fields">
                    {form.fields} fields
                  </span>
                </div>

                <h3>{form.title}</h3>
                <p>{form.description}</p>

                {form.isSavedForm ? (
                  <div className="form-card-actions">
                    <button
                      type="button"
                      className="form-card-button"
                      onClick={() => handleEditForm(form)}
                    >
                      Edit Form
                    </button>

                    <button
                      type="button"
                      className="form-card-button fill-form-button"
                      onClick={() => handleFillForm(form)}
                    >
                      Fill Form →
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="form-card-button"
                    onClick={() => handleFillForm(form)}
                  >
                    View Sample →
                  </button>
                )}
              </article>
            ))}

            {filteredForms.length === 0 && (
              <p className="empty-state">
                No forms found. Try another search.
              </p>
            )}
          </div>
        </section>

        <section className="ai-intro" id="create">
          <div className="ai-intro-icon">✦</div>

          <div className="ai-intro-content">
            <h3>Try AI Magic Input</h3>
            <p>
              AI-powered text-to-form generation will be connected
              in a later phase.
            </p>
          </div>

          <button
            type="button"
            className="ai-intro-button"
            onClick={handleCreateForm}
          >
            Get Started →
          </button>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
