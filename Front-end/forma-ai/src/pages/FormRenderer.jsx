
import { useEffect, useState } from "react";
import {
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import "./FormRenderer.css";

const FORMS_KEY = "forma-ai-saved-forms";
const RESPONSES_KEY = "forma-ai-form-responses";
const ACTIVITY_KEY = "forma-ai-activity-history";

function FormRenderer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const responseId = searchParams.get("response");
  const isEditing = responseId !== null;

  const [form, setForm] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const savedForms = JSON.parse(
        localStorage.getItem(FORMS_KEY) || "[]"
      );

      const selectedForm = savedForms.find(
        (item) => String(item.id) === String(id)
      );

      if (!selectedForm) {
        setForm(null);
        return;
      }

      setForm(selectedForm);

      if (isEditing) {
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
              restoredAnswers[fieldId] = match.value ?? match.answer ?? "";
            }
          });

          setAnswers(restoredAnswers);
        }
      }
    } catch (err) {
      console.error("Unable to load form or response:", err);
      setForm(null);
      setError("Unable to load the form. Please try again.");
    }
  }, [id, isEditing, responseId]);

  function handleChange(fieldId, value) {
    setAnswers((previous) => ({
      ...previous,
      [fieldId]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form || !Array.isArray(form.fields)) {
      setError("Form data is unavailable.");
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
          answers,
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
          answers,
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

  if (!form) {
    return (
      <main className="renderer-page">
        <div className="renderer-message">
          <h2>Form not found</h2>
          <p>{error || "Please open a form that you have already saved."}</p>
          <button type="button" onClick={() => navigate("/responses")}>
            Back to Responses
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
            Your response for "{form.title}" has been saved in this browser.
          </p>
          <button
            type="button"
            onClick={() => navigate("/responses")}
          >
            Back to Responses
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="renderer-page">
      <div className="renderer-container">
        <button
          type="button"
          className="renderer-back"
          onClick={() =>
            navigate(isEditing ? "/responses" : "/dashboard")
          }
        >
          ← {isEditing ? "Back to Responses" : "Back to Dashboard"}
        </button>

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
          {form.fields.map((field, index) => {
            const fieldId = `field-${field.id ?? index}`;
            const fieldType = String(field.type || "Text").toLowerCase();
            const value = answers[fieldId] ?? "";

            return (
              <div className="renderer-field" key={fieldId}>
                <label htmlFor={fieldId}>
                  {field.label || `Field ${index + 1}`}
                  {field.required && (
                    <span className="required-star"> *</span>
                  )}
                </label>

                {fieldType === "dropdown" ? (
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
                    {(Array.isArray(field.options) ? field.options : [])
                      .filter((option) => String(option).trim() !== "")
                      .map((option, optionIndex) => (
                        <option key={optionIndex} value={option}>
                          {option}
                        </option>
                      ))}
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
                      ["text", "email", "number", "date"].includes(fieldType)
                        ? fieldType
                        : "text"
                    }
                    placeholder={field.placeholder || ""}
                    value={value}
                    required={Boolean(field.required)}
                    onChange={(event) =>
                      handleChange(fieldId, event.target.value)
                    }
                  />
                )}
              </div>
            );
          })}

          {error && <p className="renderer-error">{error}</p>}

          <button className="renderer-submit" type="submit">
            {isEditing ? "Update Response →" : "Submit Form →"}
          </button>
        </form>

        <p className="renderer-footer">Powered by Forma AI</p>
      </div>
    </main>
  );
}

export default FormRenderer;
