import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import TemplateCard from "../components/templates/TemplateCard";
import { fetchForms, fetchForm } from "../utils/formsApi";

import "./Templates.css";

function Templates() {
  const navigate = useNavigate();

  const [templates, setTemplates] = useState([]);
  const [schemas, setSchemas] = useState({});
  const [schemaLoading, setSchemaLoading] = useState({});
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("name");
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadTemplates() {
      try {
        const data = await fetchForms();
        const list = Array.isArray(data) ? data : [];

        if (cancelled) return;

        setTemplates(list);
        setStatus("ready");

        const loadingState = {};
        list.forEach((template) => {
          loadingState[template.formId] = true;
        });
        setSchemaLoading(loadingState);

        const results = await Promise.all(
          list.map(async (template) => {
            try {
              const schema = await fetchForm(template.formId);
              return { formId: template.formId, schema };
            } catch {
              return { formId: template.formId, schema: null };
            }
          })
        );

        if (cancelled) return;

        const schemaMap = {};
        const completedLoading = {};

        results.forEach(({ formId, schema }) => {
          if (schema) schemaMap[formId] = schema;
          completedLoading[formId] = false;
        });

        setSchemas(schemaMap);
        setSchemaLoading(completedLoading);
      } catch (err) {
        if (cancelled) return;

        setError(err.message || "Unable to load templates.");
        setStatus("error");
      }
    }

    loadTemplates();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredTemplates = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = templates.filter((template) => {
      const schema = schemas[template.formId];
      const fields = (schema?.sections || []).flatMap(
        (section) => section.fields || []
      );

      const matchesSearch =
        (template.title || "").toLowerCase().includes(query) ||
        (template.description || "").toLowerCase().includes(query);

      const matchesFilter =
        filter === "all" ||
        (filter === "conditional" &&
          fields.some((field) => field.showIf)) ||
        (filter === "required" &&
          fields.some((field) => field.required));

      return matchesSearch && matchesFilter;
    });

    return filtered.sort((a, b) => {
      if (sort === "questions") {
        const countA = (schemas[a.formId]?.sections || []).reduce(
          (total, section) => total + (section.fields || []).length,
          0
        );
        const countB = (schemas[b.formId]?.sections || []).reduce(
          (total, section) => total + (section.fields || []).length,
          0
        );

        return countB - countA;
      }

      return (a.title || "").localeCompare(b.title || "");
    });
  }, [templates, schemas, search, filter, sort]);

  function handleUseTemplate(formId) {
    navigate(`/fill-form/${encodeURIComponent(formId)}?source=server`);
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <Header />

        <section className="templates-heading">
          <div>
            <p className="templates-eyebrow">FORM LIBRARY</p>
            <h1>Templates</h1>
            <p className="templates-description">
              Explore ready-made forms, preview their structure and choose
              the right starting point for your workflow.
            </p>
          </div>

          <button
            type="button"
            className="templates-create-button"
            onClick={() => navigate("/create-form")}
          >
            + Create Form
          </button>
        </section>

        <section className="templates-content">
          <div className="templates-toolbar">
            <div>
              <h2>Explore Templates</h2>
              <p>
                {status === "ready"
                  ? `${filteredTemplates.length} of ${templates.length} templates`
                  : "Browse ready-made forms"}
              </p>
            </div>

            <input
              type="search"
              className="templates-search"
              placeholder="Search templates..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search templates"
            />
          </div>

          {status === "ready" && (
            <div className="templates-filters">
              <div className="templates-filter-group">
                <label htmlFor="template-filter">Show</label>
                <select
                  id="template-filter"
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                >
                  <option value="all">All templates</option>
                  <option value="conditional">Conditional logic</option>
                  <option value="required">Required fields</option>
                </select>
              </div>

              <div className="templates-filter-group">
                <label htmlFor="template-sort">Sort by</label>
                <select
                  id="template-sort"
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                >
                  <option value="name">Name</option>
                  <option value="questions">Most questions</option>
                </select>
              </div>
            </div>
          )}

          {status === "loading" && (
            <div className="templates-message" role="status">
              Loading templates...
            </div>
          )}

          {status === "error" && (
            <div className="templates-message templates-error" role="alert">
              <h3>Couldn't load templates</h3>
              <p>{error}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
              >
                Try Again
              </button>
            </div>
          )}

          {status === "ready" && filteredTemplates.length > 0 && (
            <div className="templates-grid">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.formId}
                  template={template}
                  schema={schemas[template.formId]}
                  loading={Boolean(schemaLoading[template.formId])}
                  onUse={handleUseTemplate}
                />
              ))}
            </div>
          )}

          {status === "ready" && filteredTemplates.length === 0 && (
            <div className="templates-empty">
              <h3>
                {search.trim() || filter !== "all"
                  ? "No matching templates"
                  : "No templates available"}
              </h3>
              <p>
                {search.trim() || filter !== "all"
                  ? "Try changing your search or filter."
                  : "Templates will appear here when they are available."}
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Templates;