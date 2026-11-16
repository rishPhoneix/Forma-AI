import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { fetchForms } from "../utils/formsApi";
import { fetchUserForms, publishUserForm } from "../utils/userFormsApi";
import "./MyForms.css";

const STORAGE_KEY = "forma-ai-saved-forms";

function Icon({ name, size = 19 }) {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true
  };

  const paths = {
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    document: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6M8 13h8M8 17h8" />
      </>
    ),
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    edit: (
      <>
        <path d="m15 5 4 4M4 20l4-.8L19 8a2.8 2.8 0 0 0-4-4L4 15v5Z" />
      </>
    ),
    template: (
      <>
        <rect x="3" y="3" width="8" height="8" rx="1.5" />
        <rect x="13" y="3" width="8" height="5" rx="1.5" />
        <rect x="13" y="10" width="8" height="11" rx="1.5" />
        <rect x="3" y="13" width="8" height="8" rx="1.5" />
      </>
    )
  };

  return <svg {...props}>{paths[name]}</svg>;
}

function MyForms() {
  const navigate = useNavigate();
  const [savedForms, setSavedForms] = useState([]);
  const [userForms, setUserForms] = useState([]);
  const [serverForms, setServerForms] = useState([]);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [userStatus, setUserStatus] = useState("loading");
  const [templateStatus, setTemplateStatus] = useState("loading");
  const [publishingId, setPublishingId] = useState(null);
  const [publishErrors, setPublishErrors] = useState({});
  const [copyMessage, setCopyMessage] = useState("");

  const loadSavedForms = useCallback(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      setSavedForms(Array.isArray(stored) ? stored : []);
    } catch (error) {
      console.error("Unable to load saved forms:", error);
      setSavedForms([]);
    }
  }, []);

  const loadUserForms = useCallback(async () => {
    setUserStatus("loading");

    try {
      const data = await fetchUserForms();
      const forms = Array.isArray(data) ? data : data?.forms;

      if (!Array.isArray(forms)) {
        throw new Error("Invalid cloud forms response.");
      }

      setUserForms(forms);
      setUserStatus("ready");
    } catch (error) {
      console.error("Unable to load personal cloud forms:", error);
      setUserStatus("error");
    }
  }, []);

  const loadServerForms = useCallback(async () => {
    setTemplateStatus("loading");

    try {
      const data = await fetchForms();
      setServerForms(Array.isArray(data) ? data : []);
      setTemplateStatus("ready");
    } catch (error) {
      console.error("Unable to load server templates:", error);
      setTemplateStatus("error");
    }
  }, []);

  useEffect(() => {
    loadSavedForms();
    window.addEventListener("storage", loadSavedForms);

    return () => {
      window.removeEventListener("storage", loadSavedForms);
    };
  }, [loadSavedForms]);

  useEffect(() => {
    loadUserForms();
    loadServerForms();
  }, [loadUserForms, loadServerForms]);

  const forms = useMemo(() => {
    const local = savedForms.map((form) => ({
      id: form.id,
      title: form.title || "Untitled Form",
      description: form.description || "Your saved form.",
      fields: Array.isArray(form.fields) ? form.fields.length : 0,
      category: "MY FORM",
      source: "local"
    }));

    const personal = userForms.map((form) => ({
      id: form._id,
      title: form.title || "Untitled Form",
      description: form.description || "Your saved form.",
      fields: Array.isArray(form.fields) ? form.fields.length : 0,
      category: "MY FORM",
      source: "mongo",
      status: form.status || "draft",
      updatedAt: form.updatedAt
    }));

    const templates = serverForms.map((form) => ({
      id: form.formId,
      title: form.title || "Untitled Template",
      description: form.description || "Ready-made form from Forma AI.",
      fields: null,
      category: "TEMPLATE",
      source: "server"
    }));

    return [...personal, ...local, ...templates];
  }, [savedForms, userForms, serverForms]);

  const counts = {
    all: forms.length,
    personal: userForms.length + savedForms.length,
    templates: serverForms.length
  };

  const filteredForms = forms.filter((form) => {
    const matchesSearch = `${form.title} ${form.description}`
      .toLowerCase()
      .includes(search.toLowerCase().trim());

    const matchesFilter =
      activeFilter === "all" ||
      (activeFilter === "personal" &&
        ["local", "mongo"].includes(form.source)) ||
      (activeFilter === "templates" && form.source === "server");

    return matchesSearch && matchesFilter;
  });

  function handleEdit(form) {
    if (form.source === "mongo") {
      navigate(
        `/create-form?edit=${encodeURIComponent(form.id)}&source=cloud`
      );
      return;
    }

    if (form.source === "local") {
      navigate(`/create-form?edit=${encodeURIComponent(form.id)}`);
    }
  }

  function handleFill(form) {
    if (form.source === "mongo" && form.status !== "published") {
      alert("Publish this form before opening its public link.");
      return;
    }

    const query = form.source === "server" ? "?source=server" : "";
    navigate(`/fill-form/${encodeURIComponent(form.id)}${query}`);
  }

  async function handleCopyLink(form) {
    if (form.source !== "mongo" || form.status !== "published") {
      alert("Publish this form before copying its public link.");
      return;
    }

    const publicUrl = `${window.location.origin}/fill-form/${encodeURIComponent(form.id)}`;

    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopyMessage("Public form link copied successfully!");
      window.setTimeout(() => setCopyMessage(""), 3000);
    } catch (error) {
      console.error("Unable to copy public link:", error);
      window.prompt("Copy your public form link:", publicUrl);
    }
  }

  async function handlePublishToggle(form) {
    const published = form.status !== "published";

    setPublishingId(form.id);
    setPublishErrors((previous) => ({
      ...previous,
      [form.id]: ""
    }));

    try {
      const updatedForm = await publishUserForm(form.id, published);
      const formData = updatedForm?.form || updatedForm;

      setUserForms((previous) =>
        previous.map((item) =>
          item._id === form.id
            ? { ...item, ...formData }
            : item
        )
      );
    } catch (error) {
      console.error("Unable to update form publishing status:", error);
      setPublishErrors((previous) => ({
        ...previous,
        [form.id]: error.message || "Unable to update publishing status."
      }));
    } finally {
      setPublishingId(null);
    }
  }

  const isLoading =
    userStatus === "loading" || templateStatus === "loading";

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main my-forms-main">
        <Header />

        <section className="my-forms-heading">
          <div>
            <p className="section-eyebrow">FORM MANAGEMENT</p>
            <h1>My Forms</h1>
            <p>
              Organize your forms, explore templates and manage your
              form workflows in one place.
            </p>
          </div>

          <button
            type="button"
            className="create-form-button"
            onClick={() => navigate("/create-form")}
          >
            <Icon name="plus" size={17} />
            Create Form
          </button>
        </section>

        <section className="my-forms-stats">
          <article className="my-forms-stat">
            <span>Total Forms</span>
            <strong>{counts.all}</strong>
          </article>

          <article className="my-forms-stat">
            <span>My Saved Forms</span>
            <strong>{counts.personal}</strong>
          </article>

          <article className="my-forms-stat">
            <span>Templates</span>
            <strong>{counts.templates}</strong>
          </article>
        </section>

        <section className="my-forms-library">
          <div className="my-forms-toolbar">
            <div>
              <p className="section-eyebrow">YOUR LIBRARY</p>
              <h2>All Forms</h2>
              <p>Find and manage your forms and templates.</p>
            </div>

            <label className="my-forms-search">
              <Icon name="search" size={17} />
              <input
                type="search"
                placeholder="Search forms..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search forms"
              />
            </label>
          </div>

          <div className="my-forms-filters">
            <button
              type="button"
              className={activeFilter === "all" ? "active" : ""}
              onClick={() => setActiveFilter("all")}
            >
              All Forms <span>{counts.all}</span>
            </button>

            <button
              type="button"
              className={activeFilter === "personal" ? "active" : ""}
              onClick={() => setActiveFilter("personal")}
            >
              My Forms <span>{counts.personal}</span>
            </button>

            <button
              type="button"
              className={activeFilter === "templates" ? "active" : ""}
              onClick={() => setActiveFilter("templates")}
            >
              Templates <span>{counts.templates}</span>
            </button>
          </div>

          {copyMessage && (
            <div className="my-forms-success" role="status">
              {copyMessage}
            </div>
          )}

          {userStatus === "error" && (
            <div className="my-forms-error" role="alert">
              <p>Unable to load your cloud forms.</p>
              <button type="button" onClick={loadUserForms}>
                Try again
              </button>
            </div>
          )}

          {templateStatus === "error" && (
            <div className="my-forms-error" role="alert">
              <p>Unable to load server templates.</p>
              <button type="button" onClick={loadServerForms}>
                Try again
              </button>
            </div>
          )}

          {isLoading && forms.length === 0 ? (
            <div className="my-forms-empty">
              Loading your forms...
            </div>
          ) : filteredForms.length > 0 ? (
            <div className="my-forms-grid">
              {filteredForms.map((form) => (
                <article
                  className="my-form-card"
                  key={`${form.source}-${form.id}`}
                >
                  <div className="my-form-card-top">
                    <div className="my-form-icon">
                      <Icon
                        name={form.source === "server" ? "template" : "document"}
                        size={21}
                      />
                    </div>

                    <span
                      className={`my-form-badge ${
                        form.source === "server" ? "template" : "personal"
                      }`}
                    >
                      {form.category}
                    </span>
                  </div>

                  <div className="my-form-card-content">
                    <h3>{form.title}</h3>
                    <p>{form.description}</p>
                  </div>

                  <div className="my-form-card-meta">
                    <span>
                      {form.source === "server"
                        ? "Server template"
                        : `${form.fields} fields`}
                    </span>

                    {form.source === "mongo" && (
                      <span> · Cloud saved · {form.status}</span>
                    )}
                  </div>

                  {form.source === "mongo" && publishErrors[form.id] && (
                    <p className="my-forms-error" role="alert">
                      {publishErrors[form.id]}
                    </p>
                  )}

                  <div className="my-form-card-actions">
                    {(form.source === "local" || form.source === "mongo") && (
                      <button
                        type="button"
                        className="my-form-edit"
                        onClick={() => handleEdit(form)}
                      >
                        <Icon name="edit" size={15} />
                        Edit
                      </button>
                    )}

                    {form.source === "mongo" && (
                      <>
                        <button
                          type="button"
                          className="my-form-fill"
                          disabled={publishingId === form.id}
                          onClick={() => handlePublishToggle(form)}
                        >
                          {publishingId === form.id
                            ? "Please wait..."
                            : form.status === "published"
                              ? "Unpublish"
                              : "Publish"}
                        </button>

                        <button
                          type="button"
                          className="my-form-fill"
                          disabled={form.status !== "published"}
                          onClick={() => handleFill(form)}
                        >
                          View Form
                          <Icon name="arrow" size={15} />
                        </button>

                        <button
                          type="button"
                          className="my-form-edit"
                          disabled={form.status !== "published"}
                          onClick={() => handleCopyLink(form)}
                        >
                          Copy Link
                        </button>
                      </>
                    )}

                    {form.source !== "mongo" && (
                      <button
                        type="button"
                        className="my-form-fill"
                        onClick={() => handleFill(form)}
                      >
                        Fill Form
                        <Icon name="arrow" size={15} />
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="my-forms-empty">
              <Icon name="document" size={29} />
              <h3>
                {search
                  ? "No matching forms"
                  : activeFilter === "personal"
                    ? "No saved forms yet"
                    : activeFilter === "templates"
                      ? "No templates available"
                      : "Your form library is empty"}
              </h3>
              <p>
                {search
                  ? "Try changing your search."
                  : activeFilter === "personal"
                    ? "Create a form to see it in your library."
                    : "Try another category or create a new form."}
              </p>

              {!search && activeFilter !== "templates" && (
                <button
                  type="button"
                  className="create-form-button"
                  onClick={() => navigate("/create-form")}
                >
                  <Icon name="plus" size={16} />
                  Create Form
                </button>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default MyForms;