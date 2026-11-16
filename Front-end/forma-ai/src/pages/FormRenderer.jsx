import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ApiError, apiFetch } from "../utils/api";
import { fetchForm } from "../utils/formsApi";
import PhoneInput from "../components/PhoneInput";
import "./FormRenderer.css";

const FORMS_KEY = "forma-ai-saved-forms";
const RESPONSES_KEY = "forma-ai-form-responses";
const ACTIVITY_KEY = "forma-ai-activity-history";
const MONGO_ID_PATTERN = /^[a-f\d]{24}$/i;

function humanize(value) {
  const text = String(value ?? "").replace(/_/g, " ").trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

function normalizeLocalForm(form) {
  return {
    ...form,
    source: "local",
    fields: (Array.isArray(form.fields) ? form.fields : []).map((field) => ({
      ...field,
      options: (Array.isArray(field.options) ? field.options : [])
        .filter((option) => String(option).trim() !== "")
        .map((option) => ({
          value: typeof option === "object" ? option.value : option,
          label: typeof option === "object" ? option.label : option,
        })),
      showIf: null,
      sectionId: null,
      sectionTitle: null,
      sectionShowIf: null,
    })),
  };
}

function normalizeServerForm(data) {
  const fields = [];

  (Array.isArray(data?.sections) ? data.sections : []).forEach((section) => {
    (Array.isArray(section.fields) ? section.fields : []).forEach((field) => {
      fields.push({
        ...field,
        options: (Array.isArray(field.options) ? field.options : []).map(
          (option) => ({
            value: typeof option === "object" ? option.value : option,
            label:
              typeof option === "object" ? option.label : humanize(option),
          })
        ),
        sectionId: section.id ?? null,
        sectionTitle: section.title || null,
        sectionShowIf: section.showIf || null,
      });
    });
  });

  return {
    id: data.formId,
    title: data.title,
    description: data.description,
    version: data.version,
    source: "server",
    fields,
  };
}

function normalizeCloudForm(data) {
  const form = data?.form ?? data;

  return {
    id: String(form._id),
    cloudFormId: String(form._id),
    title: form.title || "Untitled Form",
    description: form.description || "",
    version: form.version || 1,
    source: "cloud",
    fields: (Array.isArray(form.fields) ? form.fields : []).map((field) => ({
      ...field,
      id: String(field.id),
      type: String(field.type || "text").toLowerCase(),
      label: field.label || "Untitled Field",
      placeholder: field.placeholder || "",
      required: Boolean(field.required),
      options: (Array.isArray(field.options) ? field.options : []).map(
        (option) => ({
          value: typeof option === "object" ? option.value : option,
          label:
            typeof option === "object" ? option.label : humanize(option),
        })
      ),
      showIf: field.showIf || null,
      sectionId: null,
      sectionTitle: null,
      sectionShowIf: null,
    })),
  };
}

function matchesRule(rule, values) {
  if (!rule) return true;

  const actual = String(values[rule.field] ?? "");

  if (rule.operator === "equals") {
    return actual === String(rule.value);
  }

  if (rule.operator === "notEquals") {
    return actual !== String(rule.value);
  }

  if (rule.operator === "in") {
    return (
      Array.isArray(rule.value) &&
      rule.value.map(String).includes(actual)
    );
  }

  if (rule.operator === "gt") {
    return Number(actual) > Number(rule.value);
  }

  if (rule.operator === "lt") {
    return Number(actual) < Number(rule.value);
  }

  console.warn("Unknown showIf operator:", rule.operator);
  return true;
}

function getVisibleFields(fields, answers) {
  const values = {};
  const visible = [];

  fields.forEach((field, index) => {
    const key = String(field.id ?? index);
    const show =
      matchesRule(field.sectionShowIf, values) &&
      matchesRule(field.showIf, values);

    if (!show) return;

    visible.push({ field, key });
    values[key] = answers[`field-${key}`] ?? "";
  });

  return visible;
}

function FormRenderer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const responseId = searchParams.get("response");
  const source = searchParams.get("source");
  const isEditing = responseId !== null;
  const isCloudRoute =
    source === "cloud" || MONGO_ID_PATTERN.test(String(id || ""));

  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      setForm(null);
      setAnswers({});
      setSubmitted(false);

      try {
        let selectedForm = null;

        if (isCloudRoute) {
          const data = await apiFetch(
            `/public/forms/${encodeURIComponent(id)}`,
            { auth: false }
          );
          selectedForm = normalizeCloudForm(data);
        } else {
          if (source !== "server") {
            const savedForms = JSON.parse(
              localStorage.getItem(FORMS_KEY) || "[]"
            );

            const match = Array.isArray(savedForms)
              ? savedForms.find(
                  (item) => String(item.id) === String(id)
                )
              : null;

            if (match) selectedForm = normalizeLocalForm(match);
          }

          if (!selectedForm) {
            selectedForm = normalizeServerForm(await fetchForm(id));
          }
        }

        if (cancelled) return;

        if (!selectedForm || !selectedForm.fields.length) {
          setForm(null);
          setError("This form has no fields or could not be found.");
          return;
        }

        setForm(selectedForm);

        if (isEditing && selectedForm.source !== "cloud") {
          const storedResponses = JSON.parse(
            localStorage.getItem(RESPONSES_KEY) || "[]"
          );

          const existingResponse = storedResponses.find(
            (item) =>
              String(item.id) === String(responseId) &&
              String(item.formId ?? item.form?.id) === String(id)
          );

          if (!existingResponse) {
            setError("Response not found. Please return to Responses.");
            return;
          }

          const previousAnswers =
            existingResponse.answers ??
            existingResponse.values ??
            existingResponse.data ??
            {};

          if (
            previousAnswers &&
            !Array.isArray(previousAnswers) &&
            typeof previousAnswers === "object"
          ) {
            setAnswers(previousAnswers);
          } else if (Array.isArray(previousAnswers)) {
            const restoredAnswers = {};

            selectedForm.fields.forEach((field, index) => {
              const fieldId = `field-${field.id ?? index}`;

              const match = previousAnswers.find(
                (item) =>
                  String(item.fieldId ?? item.id ?? "") ===
                    String(field.id ?? index) ||
                  (item.label || item.fieldLabel) === field.label
              );

              if (match) {
                restoredAnswers[fieldId] =
                  match.value ?? match.answer ?? "";
              }
            });

            setAnswers(restoredAnswers);
          }
        }
      } catch (err) {
        console.error("Unable to load form:", err);

        if (!cancelled) {
          setForm(null);
          setError(
            err instanceof ApiError
              ? err.message
              : "Unable to load the form. Please try again."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [id, source, isEditing, responseId, isCloudRoute]);

  function handleChange(fieldId, value) {
    setAnswers((previous) => ({
      ...previous,
      [fieldId]: value,
    }));
  }

    async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form || !Array.isArray(form.fields)) {
      setError("Form data is unavailable.");
      return;
    }

    const visibleFields = getVisibleFields(form.fields, answers);
    const visibleAnswers = {};

    visibleFields.forEach(({ field, key }) => {
      const fieldId = `field-${key}`;
      visibleAnswers[fieldId] =
        field.type === "checkbox"
          ? Boolean(answers[fieldId])
          : answers[fieldId] ?? "";
    });

    if (form.source === "cloud") {
      const cloudAnswers = {};

      visibleFields.forEach(({ field, key }) => {
        cloudAnswers[key] =
          field.type === "checkbox"
            ? Boolean(answers[`field-${key}`])
            : answers[`field-${key}`] ?? "";
      });

      setIsSubmitting(true);

      try {
        await apiFetch(
          `/public/forms/${encodeURIComponent(form.cloudFormId)}/submissions`,
          {
            method: "POST",
            auth: false,
            body: { answers: cloudAnswers },
          }
        );

        setSubmitted(true);
      } catch (err) {
        console.error("Unable to submit cloud response:", err);
        setError(
          err instanceof ApiError
            ? err.message
            : "Unable to submit your response. Please try again."
        );
      } finally {
        setIsSubmitting(false);
      }

      return;
    }

    try {
      const existingResponses = JSON.parse(
        localStorage.getItem(RESPONSES_KEY) || "[]"
      );

      if (!Array.isArray(existingResponses)) {
        throw new Error("Invalid response data.");
      }

      const now = new Date().toISOString();

      if (isEditing) {
        const responseIndex = existingResponses.findIndex(
          (item) =>
            String(item.id) === String(responseId) &&
            String(item.formId ?? item.form?.id) === String(form.id)
        );

        if (responseIndex === -1) {
          setError("The response could not be found. It was not updated.");
          return;
        }

        existingResponses[responseIndex] = {
          ...existingResponses[responseIndex],
          formId: form.id,
          formTitle: form.title,
          answers: visibleAnswers,
          updatedAt: now,
        };

        try {
          const activities = JSON.parse(
            localStorage.getItem(ACTIVITY_KEY) || "[]"
          );

          if (Array.isArray(activities)) {
            activities.unshift({
              id: `${Date.now()}-${Math.random()}`,
              action: "Response Edited",
              formId: form.id,
              formTitle: form.title,
              timestamp: now,
            });

            localStorage.setItem(
              ACTIVITY_KEY,
              JSON.stringify(activities.slice(0, 200))
            );
          }
        } catch (activityError) {
          console.error("Unable to record activity:", activityError);
        }
      } else {
        existingResponses.push({
          id: `${Date.now()}-${Math.random()}`,
          formId: form.id,
          formTitle: form.title,
          source: form.source,
          answers: visibleAnswers,
          submittedAt: now,
        });
      }

      localStorage.setItem(
        RESPONSES_KEY,
        JSON.stringify(existingResponses)
      );

      setSubmitted(true);
    } catch (err) {
      console.error("Unable to save response:", err);
      setError("Unable to save your response. Please try again.");
    }
  }

  if (loading) {
    return (
      <main className="renderer-page">
        <div className="renderer-message">
          <h2>Loading form...</h2>
        </div>
      </main>
    );
  }

  if (!form) {
    return (
      <main className="renderer-page">
        <div className="renderer-message">
          <h2>Form not found</h2>
          <p>{error || "This form could not be found."}</p>
          <button
            type="button"
            onClick={() =>
              navigate(isEditing ? "/responses" : "/dashboard")
            }
          >
            {isEditing ? "Back to Responses" : "Back to Dashboard"}
          </button>
        </div>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="renderer-page">
        <section className="renderer-success">
          <div className="success-icon">✓</div>
          <h1>
            {isEditing
              ? "Response Updated Successfully!"
              : "Form Submitted Successfully!"}
          </h1>
          <p>
            {form.source === "cloud"
              ? `Thank you! Your response for "${form.title}" has been saved successfully.`
              : `Your response for "${form.title}" has been saved in this browser.`}
          </p>
          {form.source !== "cloud" && (
            <button
              type="button"
              onClick={() => navigate("/responses")}
            >
              Back to Responses
            </button>
          )}
        </section>
      </main>
    );
  }

  const visibleFields = getVisibleFields(form.fields, answers);

  return (
    <main className="renderer-page">
      <div className="renderer-container">
        {!isCloudRoute && (
          <button
            type="button"
            className="renderer-back"
            onClick={() =>
              navigate(isEditing ? "/responses" : "/dashboard")
            }
          >
            ← {isEditing ? "Back to Responses" : "Back to Dashboard"}
          </button>
        )}

        <header className="renderer-header">
          <span className="renderer-tag">FORMA AI</span>
          <h1>{form.title}</h1>
          <p>{form.description || "Please complete the form below."}</p>
          <div className="renderer-divider" />
          <p className="required-note">
            <span>*</span> Required fields
          </p>
        </header>

                <form className="renderer-form" onSubmit={handleSubmit}>
          {visibleFields.map(({ field, key }, position) => {
            const fieldId = `field-${key}`;
            const fieldType = String(field.type || "text").toLowerCase();
            const value = answers[fieldId] ?? "";
            const previous = visibleFields[position - 1]?.field;
            const showSectionTitle =
              field.sectionTitle &&
              (!previous || previous.sectionId !== field.sectionId);

            return (
              <div key={fieldId}>
                {showSectionTitle && (
                  <h2
                    className="renderer-section-title"
                    style={{
                      margin: "24px 0 8px",
                      fontSize: "1.1rem",
                      color: "inherit",
                    }}
                  >
                    {field.sectionTitle}
                  </h2>
                )}

                <div className="renderer-field">
                  <label htmlFor={fieldId}>
                    {field.label || `Field ${position + 1}`}
                    {field.required && (
                      <span className="required-star"> *</span>
                    )}
                  </label>

                  {fieldType === "phone" ? (
                    <PhoneInput
                      id={fieldId}
                      name={fieldId}
                      value={value}
                      required={Boolean(field.required)}
                      disabled={isSubmitting}
                      placeholder={field.placeholder || "Enter phone number"}
                      onChange={(nextValue) =>
                        handleChange(fieldId, nextValue)
                      }
                    />
                  ) : fieldType === "checkbox" ? (
                    <input
                      id={fieldId}
                      name={fieldId}
                      type="checkbox"
                      checked={Boolean(value)}
                      required={Boolean(field.required)}
                      onChange={(event) =>
                        handleChange(fieldId, event.target.checked)
                      }
                    />
                  ) : fieldType === "dropdown" ? (
                    <select
                      id={fieldId}
                      name={fieldId}
                      value={value}
                      required={Boolean(field.required)}
                      onChange={(event) =>
                        handleChange(fieldId, event.target.value)
                      }
                    >
                      <option value="">Select an option</option>
                      {(Array.isArray(field.options) ? field.options : []).map(
                        (option, optionIndex) => (
                          <option
                            key={optionIndex}
                            value={option.value}
                          >
                            {option.label}
                          </option>
                        )
                      )}
                    </select>
                  ) : fieldType === "textarea" ? (
                    <textarea
                      id={fieldId}
                      name={fieldId}
                      placeholder={field.placeholder || ""}
                      value={value}
                      required={Boolean(field.required)}
                      onChange={(event) =>
                        handleChange(fieldId, event.target.value)
                      }
                      rows={4}
                    />
                  ) : (
                    <input
                      id={fieldId}
                      name={fieldId}
                      type={
                        ["text", "email", "number", "date"].includes(
                          fieldType
                        )
                          ? fieldType
                          : "text"
                      }
                      placeholder={field.placeholder || ""}
                      value={value}
                      required={Boolean(field.required)}
                      pattern={field.pattern || undefined}
                      title={
                        field.pattern
                          ? `Please match the required format: ${field.label}`
                          : undefined
                      }
                      onChange={(event) =>
                        handleChange(fieldId, event.target.value)
                      }
                    />
                  )}
                </div>
              </div>
            );
          })}

          {error && <p className="renderer-error">{error}</p>}

          <button
            className="renderer-submit"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Submitting..."
              : isEditing
                ? "Update Response →"
                : "Submit Form →"}
          </button>
        </form>

        <p className="renderer-footer">Powered by Forma AI</p>
      </div>
    </main>
  );
}

export default FormRenderer;