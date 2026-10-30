
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import jsPDF from "jspdf";
import "./FormBuilder.css";

const STORAGE_KEY = "forma-ai-saved-forms";
const ACTIVITY_KEY = "forma-ai-activity-history";

function logActivity(action, formId, formTitle) {
  try {
    const activities = JSON.parse(
      localStorage.getItem(ACTIVITY_KEY) || "[]"
    );

    activities.unshift({
      id: `${Date.now()}-${Math.random()}`,
      action,
      formId,
      formTitle,
      timestamp: new Date().toISOString(),
    });

    localStorage.setItem(
      ACTIVITY_KEY,
      JSON.stringify(activities.slice(0, 200))
    );
  } catch (error) {
    console.error("Unable to save activity:", error);
  }
}

function FormBuilder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");

  const [formTitle, setFormTitle] = useState("Untitled Form");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState([]);
  const [saveMessage, setSaveMessage] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");

  useEffect(() => {
    if (!editId) return;

    try {
      const savedForms = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
      );

      const existingForm = savedForms.find(
        (form) => String(form.id) === String(editId)
      );

      if (existingForm) {
        setFormTitle(existingForm.title || "Untitled Form");
        setDescription(existingForm.description || "");

        setFields(
          Array.isArray(existingForm.fields)
            ? existingForm.fields.map((field) => ({
                ...field,
                options:
                  field.type === "Dropdown"
                    ? Array.isArray(field.options) &&
                      field.options.length
                      ? field.options
                      : [""]
                    : field.options || [],
              }))
            : []
        );
      } else {
        setSaveMessage("Saved form not found.");
      }
    } catch (error) {
      console.error("Unable to load saved form:", error);
      setSaveMessage("Unable to load this form.");
    }
  }, [editId]);

  const addField = (type) => {
    const newField = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      label: type === "Dropdown" ? "Choose an option" : `${type} Field`,
      placeholder:
        type === "Dropdown"
          ? "Please select an option"
          : `Enter ${type.toLowerCase()}`,
      required: false,
      options: type === "Dropdown" ? [""] : [],
    };

    setFields((previous) => [...previous, newField]);
    setSaveMessage("");
    setSubmitMessage("");
  };

  const updateField = (id, property, value) => {
    setFields((previous) =>
      previous.map((field) =>
        field.id === id ? { ...field, [property]: value } : field
      )
    );

    setSaveMessage("");
    setSubmitMessage("");
  };

  const removeField = (id) => {
    setFields((previous) =>
      previous.filter((field) => field.id !== id)
    );

    setSaveMessage("");
    setSubmitMessage("");
  };

  // Download a blank form template as a PDF.
  const downloadFormPDF = () => {
    const cleanTitle = formTitle.trim();

    if (!cleanTitle || cleanTitle === "Untitled Form") {
      setSaveMessage("Please enter a proper form title first.");
      return;
    }

    if (fields.length === 0) {
      setSaveMessage("Please add at least one field first.");
      return;
    }

    try {
      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 18;
      const contentWidth = pageWidth - margin * 2;
      const bottomLimit = pageHeight - 22;
      let y = 25;

      const addPageIfNeeded = (height) => {
        if (y + height > bottomLimit) {
          doc.addPage();
          y = 22;
        }
      };

      doc.setFillColor(23, 59, 103);
      doc.rect(0, 0, pageWidth, 12, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(21);
      doc.setTextColor(23, 59, 103);

      const titleLines = doc.splitTextToSize(
        cleanTitle,
        contentWidth
      );

      doc.text(titleLines, margin, y);
      y += titleLines.length * 9 + 3;

      if (description.trim()) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(90, 100, 115);

        const descriptionLines = doc.splitTextToSize(
          description.trim(),
          contentWidth
        );

        addPageIfNeeded(descriptionLines.length * 5 + 8);
        doc.text(descriptionLines, margin, y);
        y += descriptionLines.length * 5 + 8;
      }

      y += 3;

      fields.forEach((field, index) => {
        const label =
          `${index + 1}. ${field.label?.trim() || "Untitled Field"}` +
          (field.required ? " *" : "");

        const labelLines = doc.splitTextToSize(
          label,
          contentWidth
        );

        const options =
          field.type === "Dropdown"
            ? (field.options || []).filter((option) =>
                String(option).trim()
              )
            : [];

        const optionsText = options.length
          ? doc.splitTextToSize(
              `Options: ${options.join(", ")}`,
              contentWidth - 6
            )
          : [];

        const answerLines = field.type === "Textarea" ? 4 : 2;

        const blockHeight =
          labelLines.length * 6 +
          optionsText.length * 5 +
          answerLines * 9 +
          12;

        addPageIfNeeded(blockHeight);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(30, 41, 59);
        doc.text(labelLines, margin, y);

        y += labelLines.length * 6 + 2;

        if (optionsText.length) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(100, 116, 139);
          doc.text(optionsText, margin + 3, y);
          y += optionsText.length * 5 + 3;
        }

        doc.setDrawColor(203, 213, 225);

        for (let line = 0; line < answerLines; line++) {
          if (y + 9 > bottomLimit) {
            doc.addPage();
            y = 22;
          }

          y += 6;
          doc.line(margin + 3, y, pageWidth - margin - 3, y);
          y += 3;
        }

        y += 6;
      });

      addPdfFooters(doc, margin);

      doc.save(`${makeSafeFilename(cleanTitle)}-blank-form.pdf`);
      setSaveMessage("Blank form PDF downloaded successfully!");
    } catch (error) {
      console.error("Unable to generate blank form PDF:", error);
      setSaveMessage("Unable to generate PDF. Please try again.");
    }
  };

  // Download the actual submitted answers as a professional PDF.
  const downloadSubmittedPDF = (answers) => {
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 18;
    const contentWidth = pageWidth - margin * 2;
    const bottomLimit = pageHeight - 23;
    let y = 20;

    const addPageIfNeeded = (height) => {
      if (y + height > bottomLimit) {
        doc.addPage();
        y = 20;
      }
    };

    // Header banner
    doc.setFillColor(23, 59, 103);
    doc.rect(0, 0, pageWidth, 43, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(19);
    doc.setTextColor(255, 255, 255);

    const titleLines = doc.splitTextToSize(
      formTitle.trim() || "Form Submission",
      contentWidth
    );

    doc.text(titleLines, margin, 18);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("COMPLETED FORM SUBMISSION", margin, 33);

    y = 53;

    if (description.trim()) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(85, 96, 110);

      const descriptionLines = doc.splitTextToSize(
        description.trim(),
        contentWidth
      );

      const descriptionHeight = descriptionLines.length * 5 + 5;
      addPageIfNeeded(descriptionHeight);

      doc.text(descriptionLines, margin, y);
      y += descriptionHeight;
    }

    addPageIfNeeded(20);

    doc.setFillColor(239, 246, 255);
    doc.roundedRect(
      margin,
      y,
      contentWidth,
      13,
      2,
      2,
      "F"
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(30, 64, 110);
    doc.text(
      `Submitted on: ${new Date().toLocaleString()}`,
      margin + 4,
      y + 8
    );

    y += 23;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(23, 59, 103);
    doc.text("Submitted Answers", margin, y);
    y += 10;

    answers.forEach((answer, index) => {
      const labelLines = doc.splitTextToSize(
        `${index + 1}. ${answer.label}`,
        contentWidth - 10
      );

      const valueLines = doc.splitTextToSize(
        String(answer.value || "Not provided"),
        contentWidth - 10
      );

      const labelHeight = labelLines.length * 5;
      const valueHeight = valueLines.length * 5;
      const cardHeight = labelHeight + valueHeight + 17;

      // If a single answer is very long, split it across pages.
      if (cardHeight > bottomLimit - 20) {
        addPageIfNeeded(20);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(51, 65, 85);
        doc.text(labelLines, margin, y);
        y += labelHeight + 3;

        const linesPerPage = Math.max(
          1,
          Math.floor((bottomLimit - y - 10) / 5)
        );

        for (
          let start = 0;
          start < valueLines.length;
          start += linesPerPage
        ) {
          if (start > 0) {
            doc.addPage();
            y = 20;
          }

          const chunk = valueLines.slice(
            start,
            start + linesPerPage
          );

          addPageIfNeeded(chunk.length * 5 + 8);

          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(30, 41, 59);
          doc.text(chunk, margin + 3, y);
          y += chunk.length * 5 + 8;
        }

        y += 5;
        return;
      }

      addPageIfNeeded(cardHeight);

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(
        margin,
        y,
        contentWidth,
        cardHeight,
        2,
        2,
        "FD"
      );

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);
      doc.text(labelLines, margin + 5, y + 7);

      const answerY = y + 7 + labelHeight + 3;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 41, 59);
      doc.text(valueLines, margin + 5, answerY);

      y += cardHeight + 5;
    });

    addPdfFooters(doc, margin);

    doc.save(
      `${makeSafeFilename(formTitle || "Forma-AI")}-submission.pdf`
    );
  };

  const saveForm = () => {
    const cleanTitle = formTitle.trim();

    if (!cleanTitle || cleanTitle === "Untitled Form") {
      setSaveMessage("Please enter a proper form title.");
      return;
    }

    if (fields.length === 0) {
      setSaveMessage("Please add at least one field.");
      return;
    }

    const invalidField = fields.find(
      (field) =>
        field.type === "Dropdown" &&
        !(field.options || []).some((option) =>
          String(option).trim()
        )
    );

    if (invalidField) {
      setSaveMessage(
        `Please add at least one choice for "${invalidField.label || "Dropdown"}".`
      );
      return;
    }

    try {
      const savedForms = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
      );

      if (!Array.isArray(savedForms)) {
        throw new Error("Saved forms data is invalid.");
      }

      const existingIndex = savedForms.findIndex(
        (form) => String(form.id) === String(editId)
      );

      if (editId && existingIndex === -1) {
        setSaveMessage(
          "This saved form could not be found. Please return to Dashboard."
        );
        return;
      }

      const cleanedFields = fields.map((field) => ({
        ...field,
        options:
          field.type === "Dropdown"
            ? (field.options || [])
                .map((option) => String(option).trim())
                .filter(Boolean)
            : field.options || [],
      }));

      let savedForm;
      let action;

      if (editId) {
        savedForm = {
          ...savedForms[existingIndex],
          title: cleanTitle,
          description: description.trim(),
          fields: cleanedFields,
          updatedAt: new Date().toISOString(),
        };

        savedForms[existingIndex] = savedForm;
        action = "Form Edited";
      } else {
        savedForm = {
          id: `form-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}`,
          title: cleanTitle,
          description: description.trim(),
          fields: cleanedFields,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        savedForms.push(savedForm);
        action = "Form Created";
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedForms));
      logActivity(action, savedForm.id, savedForm.title);

      setFields(cleanedFields);
      setSaveMessage(
        editId
          ? "Form updated successfully!"
          : "Form saved successfully!"
      );
      setSubmitMessage("");
    } catch (error) {
      console.error("Unable to save form:", error);
      setSaveMessage("Unable to save the form. Please try again.");
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (fields.length === 0) {
      setSubmitMessage("Please add fields before submitting.");
      return;
    }

    const formData = new FormData(event.currentTarget);

    const submittedAnswers = fields.map((field) => ({
      label: field.label?.trim() || field.type || "Untitled Field",
      type: field.type,
      value: String(
        formData.get(`field-${field.id}`) ?? ""
      ).trim(),
    }));

    try {
      downloadSubmittedPDF(submittedAnswers);

      const savedForms = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
      );

      const currentForm = savedForms.find(
        (form) => String(form.id) === String(editId)
      );

      if (currentForm) {
        logActivity(
          "Preview Submitted",
          currentForm.id,
          currentForm.title
        );
      }

      setSubmitMessage(
        "Form submitted! Your completed PDF download has started."
      );
      setSaveMessage("");
    } catch (error) {
      console.error("Unable to process submission:", error);
      setSubmitMessage(
        "Unable to generate the PDF. Please try again."
      );
    }
  };

  const renderField = (field) => {
    const commonProps = {
      id: `field-${field.id}`,
      name: `field-${field.id}`,
      placeholder: field.placeholder || "",
      required: Boolean(field.required),
    };

    switch (field.type) {
      case "Email":
        return <input type="email" {...commonProps} />;

      case "Number":
        return <input type="number" {...commonProps} />;

      case "Date":
        return <input type="date" {...commonProps} />;

      case "Textarea":
        return <textarea {...commonProps} rows={4} />;

      case "Dropdown":
        return (
          <select {...commonProps} defaultValue="">
            <option value="">Select an option</option>
            {(field.options || [])
              .filter((option) => String(option).trim() !== "")
              .map((option, index) => (
                <option
                  key={`${option}-${index}`}
                  value={option}
                >
                  {option}
                </option>
              ))}
          </select>
        );

      default:
        return <input type="text" {...commonProps} />;
    }
  };

  return (
    <div className="builder-layout">
      <Sidebar />

      <main className="builder-main">
        <Header />

        <section className="builder-content">
          <div className="builder-heading">
            <div>
              <p className="builder-eyebrow">FORM WORKSPACE</p>
              <h1>
                {editId ? "Edit Saved Form" : "Dynamic Form Builder"}
              </h1>
              <p>
                Create, customize, preview, and download professional
                forms.
              </p>
            </div>
          </div>

          <div className="builder-grid">
            <section className="builder-panel">
              <h2>Form Settings</h2>

              <label className="builder-label">
                Form Title
                <input
                  value={formTitle}
                  onChange={(event) => {
                    setFormTitle(event.target.value);
                    setSaveMessage("");
                  }}
                  placeholder="Enter form title"
                />
              </label>

              <label className="builder-label">
                Description
                <textarea
                  value={description}
                  onChange={(event) => {
                    setDescription(event.target.value);
                    setSaveMessage("");
                  }}
                  placeholder="Describe your form"
                  rows={3}
                />
              </label>

              <div className="field-picker-heading">
                <h2>Add Fields</h2>
                <span>{fields.length} fields</span>
              </div>

              <div className="field-type-grid">
                {[
                  "Text",
                  "Email",
                  "Number",
                  "Dropdown",
                  "Date",
                  "Textarea",
                ].map((type) => (
                  <button
                    type="button"
                    className="field-type-button"
                    key={type}
                    onClick={() => addField(type)}
                  >
                    <span>+</span> {type}
                  </button>
                ))}
              </div>

              <h2 className="added-fields-heading">
                Customize Fields
              </h2>

              {fields.length === 0 ? (
                <p className="empty-fields">
                  No fields added yet. Select a field type above.
                </p>
              ) : (
                fields.map((field, index) => (
                  <div className="field-editor" key={field.id}>
                    <div className="field-editor-top">
                      <strong>
                        {index + 1}. {field.type}
                      </strong>

                      <button
                        type="button"
                        className="remove-field"
                        onClick={() => removeField(field.id)}
                      >
                        Remove
                      </button>
                    </div>

                    <label className="builder-label">
                      Field Label
                      <input
                        value={field.label || ""}
                        onChange={(event) =>
                          updateField(
                            field.id,
                            "label",
                            event.target.value
                          )
                        }
                        placeholder="Example: Department"
                      />
                    </label>

                    {field.type !== "Date" && (
                      <label className="builder-label">
                        Placeholder
                        <input
                          value={field.placeholder || ""}
                          onChange={(event) =>
                            updateField(
                              field.id,
                              "placeholder",
                              event.target.value
                            )
                          }
                          placeholder="Enter helpful instructions"
                        />
                      </label>
                    )}

                    {field.type === "Dropdown" && (
                      <div className="builder-label">
                        <span>Dropdown Choices</span>
                        <span className="field-help-text">
                          Enter each choice in a separate box.
                        </span>

                        {(field.options || [""]).map(
                          (option, optionIndex) => (
                            <div
                              key={optionIndex}
                              className="dropdown-option-row"
                            >
                              <input
                                type="text"
                                value={option}
                                placeholder={`Option ${optionIndex + 1}`}
                                onChange={(event) => {
                                  const updatedOptions = [
                                    ...(field.options || [""]),
                                  ];

                                  updatedOptions[optionIndex] =
                                    event.target.value;

                                  updateField(
                                    field.id,
                                    "options",
                                    updatedOptions
                                  );
                                }}
                              />

                              <button
                                type="button"
                                className="remove-field"
                                onClick={() => {
                                  const updatedOptions = (
                                    field.options || [""]
                                  ).filter(
                                    (_, i) => i !== optionIndex
                                  );

                                  updateField(
                                    field.id,
                                    "options",
                                    updatedOptions.length
                                      ? updatedOptions
                                      : [""]
                                  );
                                }}
                              >
                                Remove
                              </button>
                            </div>
                          )
                        )}

                        <button
                          type="button"
                          className="field-type-button add-option-button"
                          onClick={() =>
                            updateField(field.id, "options", [
                              ...(field.options || [""]),
                              "",
                            ])
                          }
                        >
                          + Add Option
                        </button>
                      </div>
                    )}

                    <label className="required-toggle">
                      <input
                        type="checkbox"
                        checked={Boolean(field.required)}
                        onChange={(event) =>
                          updateField(
                            field.id,
                            "required",
                            event.target.checked
                          )
                        }
                      />
                      Required field
                    </label>
                  </div>
                ))
              )}

              <button
                type="button"
                className="preview-submit"
                onClick={saveForm}
              >
                {editId ? "Update Form" : "Save Form"}
              </button>

              {saveMessage && (
                <p className="builder-message" role="status">
                  {saveMessage}
                </p>
              )}

              <button
                type="button"
                className="field-type-button dashboard-button"
                onClick={() => navigate("/dashboard")}
              >
                Back to Dashboard
              </button>
            </section>

            <section className="preview-panel">
              <div className="preview-heading">
                <div>
                  <span className="preview-status">LIVE PREVIEW</span>
                  <h2>{formTitle || "Untitled Form"}</h2>
                </div>

                <button
                  type="button"
                  className="download-pdf-button"
                  onClick={downloadFormPDF}
                >
                  Download Blank PDF
                </button>
              </div>

              <p className="preview-description">
                {description || "Your form description will appear here."}
              </p>

              <form onSubmit={handleSubmit}>
                {fields.map((field) => (
                  <div className="preview-field" key={field.id}>
                    <label htmlFor={`field-${field.id}`}>
                      {field.label || "Untitled Field"}
                      {field.required && (
                        <span className="required-star"> *</span>
                      )}
                    </label>

                    {renderField(field)}
                  </div>
                ))}

                {fields.length === 0 && (
                  <div className="preview-empty">
                    <div className="preview-empty-icon">+</div>
                    <h3>Your form will appear here</h3>
                    <p>Add fields using the panel on the left.</p>
                  </div>
                )}

                <button
                  type="submit"
                  className="preview-submit"
                  disabled={fields.length === 0}
                >
                  Submit Form & Download PDF
                </button>

                {submitMessage && (
                  <p className="submit-message" role="status">
                    {submitMessage}
                  </p>
                )}
              </form>

              <p className="preview-footer">Built with Forma AI</p>
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}

function makeSafeFilename(title) {
  return (
    String(title)
      .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
      .replace(/\s+/g, "-")
      .slice(0, 80) || "Forma-AI-Form"
  );
}

function addPdfFooters(doc, margin) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const totalPages = doc.internal.getNumberOfPages();

  for (let page = 1; page <= totalPages; page++) {
    doc.setPage(page);
    doc.setDrawColor(226, 232, 240);
    doc.line(
      margin,
      pageHeight - 13,
      pageWidth - margin,
      pageHeight - 13
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("Generated with Forma AI", margin, pageHeight - 7);
    doc.text(
      `Page ${page} of ${totalPages}`,
      pageWidth - margin,
      pageHeight - 7,
      { align: "right" }
    );
  }
}

export default FormBuilder;
