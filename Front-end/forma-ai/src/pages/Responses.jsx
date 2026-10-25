
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import "./Responses.css";

const RESPONSES_KEY = "forma-ai-form-responses";
const FORMS_KEY = "forma-ai-saved-forms";

function formatValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
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

  if (answers && typeof answers === "object") {
    return Object.entries(answers).map(([key, value]) => {
      const fieldId = key.startsWith("field-")
        ? key.slice(6)
        : key;

      const field = form?.fields?.find(
        (item, index) =>
          String(item.id ?? index) === fieldId
      );

      return {
        label: field?.label || key,
        value: formatValue(value),
      };
    });
  }

  return [];
}

function Responses() {
  const navigate = useNavigate();
  const [responses, setResponses] = useState([]);
  const [formTitles, setFormTitles] = useState({});
  const [forms, setForms] = useState([]);

  useEffect(() => {
    function loadResponses() {
      try {
        const storedResponses = JSON.parse(
          localStorage.getItem(RESPONSES_KEY) || "[]"
        );
        const storedForms = JSON.parse(
          localStorage.getItem(FORMS_KEY) || "[]"
        );

        setResponses(
          Array.isArray(storedResponses) ? storedResponses : []
        );

        setForms(Array.isArray(storedForms) ? storedForms : []);

        const titles = {};
        if (Array.isArray(storedForms)) {
          storedForms.forEach((form) => {
            titles[String(form.id)] = form.title;
          });
        }
        setFormTitles(titles);
      } catch (error) {
        console.error("Unable to load responses:", error);
        setResponses([]);
        setForms([]);
        setFormTitles({});
      }
    }

    loadResponses();
    window.addEventListener("storage", loadResponses);

    return () => {
      window.removeEventListener("storage", loadResponses);
    };
  }, []);

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main responses-main">
        <Header />

        <section className="responses-heading">
          <div>
            <p className="responses-eyebrow">FORM MANAGEMENT</p>
            <h1>Form Responses</h1>
            <p>View and edit submissions received from your saved forms.</p>
          </div>

          <div className="responses-count">
            <span>Total Submissions</span>
            <strong>{responses.length}</strong>
          </div>
        </section>

        {responses.length === 0 ? (
          <section className="responses-empty">
            <div className="responses-empty-icon">☷</div>
            <h2>No responses yet</h2>
            <p>
              Open a saved form, fill in the fields, and submit it.
              Your submissions will appear here.
            </p>
          </section>
        ) : (
          <section className="responses-list">
            {responses.map((response, index) => {
              const formId = response.formId ?? response.form?.id;

              const form = forms.find(
                (item) => String(item.id) === String(formId)
              );

              const formTitle =
                response.formTitle ||
                response.form?.title ||
                response.title ||
                formTitles[String(formId)] ||
                "Untitled Form";

              const submittedAt =
                response.updatedAt ||
                response.submittedAt ||
                response.createdAt ||
                response.date;

              const answers = getAnswerEntries(
                response.answers ?? response.values ?? response.data,
                form
              );

              const responseId = response.id;

              return (
                <article
                  className="response-card"
                  key={responseId ?? `${formId}-${index}`}
                >
                  <div className="response-card-heading">
                    <div>
                      <span className="response-badge">SUBMITTED</span>
                      <h2>{formTitle}</h2>
                    </div>

                    <span className="response-date">
                      {submittedAt &&
                      !Number.isNaN(new Date(submittedAt).getTime())
                        ? new Date(submittedAt).toLocaleString()
                        : "Date unavailable"}
                    </span>
                  </div>

                  <div className="response-answers">
                    {answers.length > 0 ? (
                      answers.map((answer, answerIndex) => (
                        <div
                          className="response-answer"
                          key={`${answer.label}-${answerIndex}`}
                        >
                          <span>{answer.label}</span>
                          <p>{answer.value}</p>
                        </div>
                      ))
                    ) : (
                      <p className="response-no-answers">
                        No answer details were found in this submission.
                      </p>
                    )}
                  </div>

                  {form && responseId != null && (
                    <button
                      type="button"
                      className="response-edit-button"
                      onClick={() =>
                        navigate(
                          `/fill-form/${encodeURIComponent(form.id)}?response=${encodeURIComponent(responseId)}`
                        )
                      }
                    >
                      Edit Response
                    </button>
                  )}

                  {!form && (
                    <p className="response-no-answers">
                      This form is no longer available to edit.
                    </p>
                  )}
                </article>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}

export default Responses;
