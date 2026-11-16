import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { ApiError, apiFetch } from "../utils/api";
import "./Responses.css";

const RESPONSES_KEY = "forma-ai-form-responses";
const FORMS_KEY = "forma-ai-saved-forms";

function formatValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.map(String).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function humanize(value) {
  const text = String(value).replace(/_/g, " ").trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

function formatDate(value) {
  if (!value) return "Date unavailable";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getAnswerEntries(answers, form) {
  if (Array.isArray(answers)) {
    return answers.map((item, index) => ({
      label:
        item.label ||
        item.fieldLabel ||
        item.name ||
        item.fieldName ||
        `Field ${index + 1}`,
      value: formatValue(item.value ?? item.answer),
    }));
  }

  if (!answers || typeof answers !== "object") return [];

  return Object.entries(answers).map(([key, value]) => {
    const fieldId = key.startsWith("field-") ? key.slice(6) : key;

    const field = form?.fields?.find(
      (item, index) => String(item.id ?? index) === fieldId
    );

    const displayValue =
      field?.type === "dropdown" && value !== "" && value != null
        ? humanize(value)
        : value;

    return {
      label: field?.label || key,
      value: formatValue(displayValue),
    };
  });
}

function normalizeCloudSubmission(submission) {
  return {
    ...submission,
    id: String(submission._id || submission.id),
    formId: String(submission.formId || ""),
    submittedAt:
      submission.submittedAt ||
      submission.createdAt ||
      submission.updatedAt,
    source: "cloud",
  };
}

function loadLocalData() {
  try {
    const storedResponses = JSON.parse(
      localStorage.getItem(RESPONSES_KEY) || "[]"
    );

    const storedForms = JSON.parse(
      localStorage.getItem(FORMS_KEY) || "[]"
    );

    return {
      responses: Array.isArray(storedResponses) ? storedResponses : [],
      forms: Array.isArray(storedForms) ? storedForms : [],
    };
  } catch (error) {
    console.error("Unable to read local response data:", error);
    return { responses: [], forms: [] };
  }
}

function Responses() {
  const navigate = useNavigate();

  const [responses, setResponses] = useState([]);
  const [forms, setForms] = useState([]);
  const [serverForms, setServerForms] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedForm, setSelectedForm] = useState("all");
  const [expandedResponses, setExpandedResponses] = useState({});

  const loadResponses = useCallback(async () => {
    setLoading(true);
    setError("");

    const localData = loadLocalData();
    setForms(localData.forms);

    try {
      const cloudData = await apiFetch("/submissions");

      const cloudResponses = Array.isArray(cloudData)
        ? cloudData.map(normalizeCloudSubmission)
        : [];

      const cloudIds = new Set(
        cloudResponses.map((response) => String(response.id))
      );

      const localResponses = localData.responses.filter(
        (response) => !cloudIds.has(String(response.id))
      );

      const combined = [...cloudResponses, ...localResponses].sort(
        (a, b) => {
          const dateA = new Date(
            a.submittedAt || a.createdAt || a.date || 0
          ).getTime();

          const dateB = new Date(
            b.submittedAt || b.createdAt || b.date || 0
          ).getTime();

          return dateB - dateA;
        }
      );

      setResponses(combined);
    } catch (requestError) {
      console.error("Unable to load cloud submissions:", requestError);
      setResponses(localData.responses);

      if (requestError instanceof ApiError) {
        setError(
          requestError.status === 401
            ? "Your session has expired. Please sign in again to load cloud submissions."
            : requestError.message
        );
      } else {
        setError(
          "Cloud submissions could not be loaded. Showing locally saved responses."
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadResponses();

    function handleStorageChange(event) {
      if (
        !event.key ||
        event.key === RESPONSES_KEY ||
        event.key === FORMS_KEY
      ) {
        loadResponses();
      }
    }

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [loadResponses]);

  useEffect(() => {
    let active = true;

    async function loadFormDetails() {
      const formIds = [
        ...new Set(
          responses
            .filter((response) => response.source === "cloud")
            .map((response) => String(response.formId || ""))
            .filter(Boolean)
        ),
      ];

      const missingIds = formIds.filter(
        (id) => !serverForms[id]
      );

      if (missingIds.length === 0) return;

      const results = await Promise.all(
        missingIds.map(async (id) => {
          try {
            const data = await apiFetch(
              `/user-forms/${encodeURIComponent(id)}`
            );

            return [id, data?.form || data];
          } catch (requestError) {
            console.error(`Unable to load form ${id}:`, requestError);
            return [id, null];
          }
        })
      );

      if (!active) return;

      setServerForms((previous) => {
        const next = { ...previous };

        results.forEach(([id, form]) => {
          next[id] = form || "missing";
        });

        return next;
      });
    }

    loadFormDetails();

    return () => {
      active = false;
    };
  }, [responses, serverForms]);

  const formTitles = useMemo(() => {
    const titles = {};

    forms.forEach((form) => {
      if (form.id) titles[String(form.id)] = form.title;
    });

    Object.entries(serverForms).forEach(([id, form]) => {
      if (form && typeof form === "object" && form.title) {
        titles[id] = form.title;
      }
    });

    return titles;
  }, [forms, serverForms]);

  const formOptions = useMemo(() => {
    const options = new Map();

    responses.forEach((response) => {
      const id = String(response.formId || response.form?.id || "");
      if (!id) return;

      const title =
        response.formTitle ||
        response.form?.title ||
        formTitles[id] ||
        "Untitled Form";

      options.set(id, title);
    });

    return Array.from(options, ([id, title]) => ({ id, title }));
  }, [responses, formTitles]);

  const filteredResponses = useMemo(() => {
    const query = search.trim().toLowerCase();

    return responses.filter((response) => {
      const formId = String(response.formId || response.form?.id || "");

      const title =
        response.formTitle ||
        response.form?.title ||
        formTitles[formId] ||
        "Untitled Form";

      const matchesForm =
        selectedForm === "all" || formId === selectedForm;

      const answerText = Object.values(
        response.answers || response.values || {}
      )
        .map((value) => formatValue(value))
        .join(" ");

      const matchesSearch =
        !query ||
        title.toLowerCase().includes(query) ||
        answerText.toLowerCase().includes(query) ||
        String(response.respondentEmail || "")
          .toLowerCase()
          .includes(query);

      return matchesForm && matchesSearch;
    });
  }, [responses, search, selectedForm, formTitles]);

  const toggleExpanded = (id) => {
    setExpandedResponses((previous) => ({
      ...previous,
      [id]: !previous[id],
    }));
  };

  function renderResponse(response, index) {
    const formId = String(response.formId || response.form?.id || "");

    const localForm = forms.find(
      (form) => String(form.id) === formId
    );

    const serverEntry = serverForms[formId];

    const serverForm =
      serverEntry && typeof serverEntry === "object"
        ? {
            ...serverEntry,
            id: String(serverEntry._id || serverEntry.id || formId),
            source: "server",
            fields: Array.isArray(serverEntry.fields)
              ? serverEntry.fields
              : [],
          }
        : null;

    const form = localForm || serverForm;

    const title =
      response.formTitle ||
      response.form?.title ||
      response.title ||
      formTitles[formId] ||
      serverForm?.title ||
      "Untitled Form";

    const responseId = String(
      response.id || response._id || `${formId}-${index}`
    );

    const answers = getAnswerEntries(
      response.answers ?? response.values ?? response.data,
      form
    );

    const expanded = Boolean(expandedResponses[responseId]);
    const visibleAnswers = expanded ? answers : answers.slice(0, 4);

    const submittedAt =
      response.submittedAt ||
      response.createdAt ||
      response.updatedAt ||
      response.date;

    const openFormQuery = localForm
      ? `?response=${encodeURIComponent(responseId)}`
      : `?source=server&response=${encodeURIComponent(responseId)}`;

    return (
      <article className="response-card" key={responseId}>
        <div className="response-card-heading">
          <div className="response-card-title">
            <span className="response-badge">
              <span className="response-badge-dot" />
              SUBMITTED
            </span>

            <h2>{title}</h2>

            {response.respondentEmail && (
              <span className="response-respondent">
                {response.respondentEmail}
              </span>
            )}
          </div>

          <time
            className="response-date"
            dateTime={submittedAt || undefined}
          >
            <span className="response-date-label">Submitted</span>
            {formatDate(submittedAt)}
          </time>
        </div>

        <div className="response-card-body">
          {answers.length > 0 ? (
            <div className="response-answers">
              {visibleAnswers.map((answer, answerIndex) => (
                <div
                  className="response-answer"
                  key={`${answer.label}-${answerIndex}`}
                >
                  <span className="response-answer-label">
                    {answer.label}
                  </span>

                  <p className="response-answer-value">
                    {answer.value}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="response-no-answers">
              No answer details were found in this submission.
            </p>
          )}

          {answers.length > 4 && (
            <button
              type="button"
              className="response-expand-button"
              onClick={() => toggleExpanded(responseId)}
            >
              {expanded
                ? "Show less"
                : `Show all ${answers.length} answers`}

              <span aria-hidden="true">
                {expanded ? "↑" : "↓"}
              </span>
            </button>
          )}

          {!form &&
            serverEntry === undefined &&
            response.source === "cloud" && (
              <p className="response-detail-note">
                Loading form details…
              </p>
            )}

          {!form && serverEntry === "missing" && (
            <p className="response-detail-note">
              The original form is no longer available.
            </p>
          )}

          {form && (
            <div className="response-card-footer">
              <span className="response-answer-count">
                {answers.length}{" "}
                {answers.length === 1 ? "answer" : "answers"}
              </span>

              <button
                type="button"
                className="response-open-button"
                onClick={() =>
                  navigate(
                    `/fill-form/${encodeURIComponent(form.id)}${openFormQuery}`
                  )
                }
              >
                Open form
                <span aria-hidden="true">→</span>
              </button>
            </div>
          )}
        </div>
      </article>
    );
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main responses-main">
        <Header />

        <section className="responses-page">
          <div className="responses-topline">
            <div>
              <p className="responses-eyebrow">
                WORKSPACE / RESPONSES
              </p>

              <h1>Form Responses</h1>

              <p className="responses-description">
                Review submissions and keep track of the information your forms collect.
              </p>
            </div>

            <div className="responses-count">
              <span
                className="responses-count-icon"
                aria-hidden="true"
              >
                <svg viewBox="0 0 24 24">
                  <path d="M7 3.75h7l4.25 4.3v11.2A1.75 1.75 0 0 1 16.5 21h-9A1.75 1.75 0 0 1 5.75 19.25v-13.75A1.75 1.75 0 0 1 7.5 3.75Z" />
                  <path d="M14 4v4.5h4.25M8.5 12h7M8.5 15.5h7" />
                </svg>
              </span>

              <span className="responses-count-label">
                Total submissions
              </span>

              <strong>{responses.length}</strong>

              <span className="responses-count-caption">
                Across your forms
              </span>
            </div>
          </div>

          <div className="responses-toolbar">
            <div className="responses-toolbar-copy">
              <h2>All submissions</h2>

              <p>
                {filteredResponses.length}{" "}
                {filteredResponses.length === 1
                  ? "response"
                  : "responses"}{" "}
                found
              </p>
            </div>

            <div className="responses-controls">
              <label className="responses-search">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="10.8" cy="10.8" r="6.8" />
                  <path d="m16 16 4.2 4.2" />
                </svg>

                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search responses"
                  aria-label="Search responses"
                />
              </label>

              <select
                className="responses-filter"
                value={selectedForm}
                onChange={(event) => setSelectedForm(event.target.value)}
                aria-label="Filter by form"
              >
                <option value="all">All forms</option>

                {formOptions.map((form) => (
                  <option value={form.id} key={form.id}>
                    {form.title}
                  </option>
                ))}
              </select>

              <button
                type="button"
                className="responses-refresh-button"
                onClick={loadResponses}
                disabled={loading}
                aria-label="Refresh responses"
                title="Refresh responses"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20 7v5h-5M4 17v-5h5" />
                  <path d="M5.6 9a7 7 0 0 1 11.8-2L20 12M4 12l2.6 5a7 7 0 0 0 11.8-2" />
                </svg>
              </button>
            </div>
          </div>

          {error && (
            <div className="responses-alert" role="status">
              <span>{error}</span>

              <button type="button" onClick={loadResponses}>
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <div className="responses-state">
              <span className="responses-loader" />
              <h2>Loading responses</h2>
              <p>Fetching your latest submissions…</p>
            </div>
          ) : filteredResponses.length === 0 ? (
            <div className="responses-state">
              <div className="responses-empty-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M7 3.75h7l4.25 4.3v11.2A1.75 1.75 0 0 1 16.5 21h-9A1.75 1.75 0 0 1 5.75 19.25v-13.75A1.75 1.75 0 0 1 7.5 3.75Z" />
                  <path d="M14 4v4.5h4.25M8.5 13h7M8.5 16h4" />
                </svg>
              </div>

              <h2>
                {responses.length === 0
                  ? "No responses yet"
                  : "No matching responses"}
              </h2>

              <p>
                {responses.length === 0
                  ? "Once someone submits one of your published forms, their response will appear here."
                  : "Try changing your search or selecting a different form."}
              </p>

              {responses.length > 0 && (
                <button
                  type="button"
                  className="responses-clear-button"
                  onClick={() => {
                    setSearch("");
                    setSelectedForm("all");
                  }}
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <section
              className="responses-list"
              aria-label="Form submissions"
            >
              {filteredResponses.map(renderResponse)}
            </section>
          )}
        </section>
      </main>
    </div>
  );
}

export default Responses;