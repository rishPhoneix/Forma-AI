import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import PhoneInput from "../components/PhoneInput";
import {
  enhanceMagicPrompt,
  generateMagicForm,
  modifyMagicForm,
} from "../utils/buildByMagicApi";
import {
  createUserForm,
  fetchUserForm,
  updateUserForm,
} from "../utils/userFormsApi";
import "./BuildByMagic.css";

const FIELD_TYPES = ["text", "email", "number", "phone", "dropdown", "date", "textarea", "checkbox"];

const FIELD_LABELS = {
  text: "Text",
  email: "Email",
  number: "Number",
  phone: "Phone",
  dropdown: "Dropdown",
  date: "Date",
  textarea: "Long Answer",
  checkbox: "Checkbox",
};

function createField(type) {
  return {
    id: `field_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type,
    label: `${FIELD_LABELS[type]} Field`,
    placeholder: "",
    options: type === "dropdown" ? ["Option 1"] : [],
    required: false,
    showIf: null,
  };
}

function cloneSnapshot(snapshot) {
  return {
    formTitle: snapshot.formTitle || "",
    description: snapshot.description || "",
    fields: (snapshot.fields || []).map((field) => ({
      ...field,
      options: Array.isArray(field.options) ? [...field.options] : [],
    })),
  };
}

function BuildByMagic() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const editId = searchParams.get("edit");

  const [prompt, setPrompt] = useState("");
  const [enhancedPrompt, setEnhancedPrompt] = useState("");
  const [aiInstruction, setAiInstruction] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState([]);
  const [formId, setFormId] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isModifying, setIsModifying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState("desktop");
  const [previewValues, setPreviewValues] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [history, setHistory] = useState([
    { formTitle: "", description: "", fields: [] },
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);

  function resetEditorHistory(snapshot) {
    const clean = cloneSnapshot(snapshot);
    setFormTitle(clean.formTitle);
    setDescription(clean.description);
    setFields(clean.fields);
    setHistory([clean]);
    setHistoryIndex(0);
  }

  function commitEditorChange(snapshot) {
    const clean = cloneSnapshot(snapshot);
    setHistory((currentHistory) => {
      const nextHistory = currentHistory.slice(0, historyIndex + 1);
      nextHistory.push(clean);
      if (nextHistory.length > 51) nextHistory.shift();
      setHistoryIndex(nextHistory.length - 1);
      return nextHistory;
    });
    setFormTitle(clean.formTitle);
    setDescription(clean.description);
    setFields(clean.fields);
    setMessage("");
  }

  function handleUndo() {
    if (historyIndex <= 0) return;
    const nextIndex = historyIndex - 1;
    const snapshot = cloneSnapshot(history[nextIndex]);
    setHistoryIndex(nextIndex);
    setFormTitle(snapshot.formTitle);
    setDescription(snapshot.description);
    setFields(snapshot.fields);
    setMessage("Last change undone.");
    setError("");
  }

  function handleRedo() {
    if (historyIndex >= history.length - 1) return;
    const nextIndex = historyIndex + 1;
    const snapshot = cloneSnapshot(history[nextIndex]);
    setHistoryIndex(nextIndex);
    setFormTitle(snapshot.formTitle);
    setDescription(snapshot.description);
    setFields(snapshot.fields);
    setMessage("Change restored.");
    setError("");
  }

  function duplicateField(id) {
    const index = fields.findIndex((field) => field.id === id);
    if (index === -1) return;
    const source = fields[index];
    const duplicate = {
      ...source,
      id: `field_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      label: `${source.label || FIELD_LABELS[source.type]} (Copy)`,
      options: Array.isArray(source.options) ? [...source.options] : [],
      showIf: source.showIf ?? null,
    };
    const nextFields = [...fields];
    nextFields.splice(index + 1, 0, duplicate);
    commitEditorChange({ formTitle, description, fields: nextFields });
  }

  function moveField(index, direction) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= fields.length) return;
    const nextFields = [...fields];
    [nextFields[index], nextFields[targetIndex]] = [
      nextFields[targetIndex],
      nextFields[index],
    ];
    commitEditorChange({ formTitle, description, fields: nextFields });
  }

  useEffect(() => {
    if (!editId) return;
    let cancelled = false;

    async function loadCloudForm() {
      setIsLoading(true);
      setError("");
      try {
        const form = await fetchUserForm(editId);
        if (cancelled) return;
        setFormId(String(form._id));
        const loadedFields = (form.fields || []).map((field) => ({
          ...field,
          options: Array.isArray(field.options) ? field.options : [],
          showIf: field.showIf ?? null,
        }));
        resetEditorHistory({
          formTitle: form.title || "",
          description: form.description || "",
          fields: loadedFields,
        });
        setPreviewValues({});
      } catch (err) {
        if (!cancelled) setError(err.message || "Unable to load this cloud form.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadCloudForm();
    return () => {
      cancelled = true;
    };
  }, [editId]);

  async function handleGenerate(event) {
    event.preventDefault();
    if (!prompt.trim()) {
      setError("Describe the form you want to create first.");
      return;
    }
    setIsGenerating(true);
    setError("");
    setMessage("");
    setEnhancedPrompt("");

    try {
      const generated = await generateMagicForm(prompt);
      resetEditorHistory({
        formTitle: generated.title || "",
        description: generated.description || "",
        fields: generated.fields || [],
      });
      setPreviewValues({});
      setFormId("");
      setAiInstruction("");
      setSearchParams({}, { replace: true });
      setMessage("Your form has been generated. You can now edit it.");
    } catch (err) {
      setError(err.message || "Unable to generate your form.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleEnhancePrompt() {
    if (!prompt.trim()) {
      setError("Enter a form description before enhancing it.");
      return;
    }
    setIsEnhancing(true);
    setError("");
    setMessage("");
    setEnhancedPrompt("");

    try {
      const result = await enhanceMagicPrompt(prompt);
      setEnhancedPrompt(result);
      setMessage("Your prompt has been enhanced. Review it before applying.");
    } catch (err) {
      setError(err.message || "Unable to enhance your prompt.");
    } finally {
      setIsEnhancing(false);
    }
  }

  function handleApplyEnhancedPrompt() {
    if (!enhancedPrompt.trim()) {
      setError("The enhanced prompt cannot be empty.");
      return;
    }
    setPrompt(enhancedPrompt.trim());
    setEnhancedPrompt("");
    setMessage("Enhanced prompt applied. You can now generate your form.");
    setError("");
  }

  async function handleModifyForm(event) {
    event.preventDefault();
    if (!fields.length) {
      setError("Generate or add fields before asking AI to modify the form.");
      return;
    }
    if (!aiInstruction.trim()) {
      setError("Enter what you want AI to change.");
      return;
    }

    setIsModifying(true);
    setError("");
    setMessage("");

    try {
      const result = await modifyMagicForm(
        {
          title: formTitle,
          description,
          fields: fields.map((field) => ({
            ...field,
            options: Array.isArray(field.options) ? [...field.options] : [],
          })),
        },
        aiInstruction.trim()
      );

      if (
        typeof result.title !== "string" ||
        typeof result.description !== "string" ||
        !Array.isArray(result.fields) ||
        result.fields.length < 1 ||
        result.fields.length > 50
      ) {
        throw new Error("AI returned an incomplete form. Your current form was not changed.");
      }

      const usedIds = new Set();
      const existingById = new Map(fields.map((field) => [String(field.id), field]));

      const updatedFields = result.fields.map((field, index) => {
        if (!FIELD_TYPES.includes(field.type)) {
          throw new Error(`AI returned an unsupported field type at position ${index + 1}.`);
        }
        const id = String(field.id || "");
        if (!id || usedIds.has(id)) {
          throw new Error("AI returned missing or duplicate field IDs. Your current form was not changed.");
        }
        usedIds.add(id);

        const previous = existingById.get(id);
        const options = Array.isArray(field.options)
          ? field.options.map((option) => String(option))
          : [];

        if (field.type === "dropdown" && !options.some((option) => option.trim())) {
          throw new Error(`Dropdown field ${index + 1} must have at least one option.`);
        }
        if (typeof field.label !== "string" || !field.label.trim()) {
          throw new Error(`Field ${index + 1} must have a label.`);
        }

        return {
          ...previous,
          ...field,
          id,
          label: field.label.trim(),
          placeholder: typeof field.placeholder === "string" ? field.placeholder : "",
          options: field.type === "dropdown" ? options : [],
          required: Boolean(field.required),
          pattern: field.pattern ?? previous?.pattern,
          showIf: field.showIf ?? previous?.showIf ?? null,
        };
      });

      commitEditorChange({
        formTitle: result.title.trim(),
        description: result.description,
        fields: updatedFields,
      });
      setPreviewValues({});
      setAiInstruction("");
      setMessage("AI updated your form. Review the changes and save when ready.");
    } catch (err) {
      setError(err.message || "Unable to modify your form with AI.");
    } finally {
      setIsModifying(false);
    }
  }

  function updateField(id, property, value) {
    const nextFields = fields.map((field) =>
      field.id === id ? { ...field, [property]: value } : field
    );
    commitEditorChange({ formTitle, description, fields: nextFields });
  }

  function addField(type) {
    commitEditorChange({
      formTitle,
      description,
      fields: [...fields, createField(type)],
    });
  }

  function removeField(id) {
    commitEditorChange({
      formTitle,
      description,
      fields: fields.filter((field) => field.id !== id),
    });
    setPreviewValues((current) => {
      const updated = { ...current };
      delete updated[id];
      return updated;
    });
  }

  async function handleSave() {
    const cleanTitle = formTitle.trim();
    if (!cleanTitle) {
      setError("Please enter a form title.");
      return;
    }
    if (!fields.length) {
      setError("Add at least one field before saving.");
      return;
    }
    if (fields.some((field) => !field.label?.trim())) {
      setError("Every field must have a label.");
      return;
    }
    if (fields.some((field) => !FIELD_TYPES.includes(field.type))) {
      setError("One or more fields have an unsupported type.");
      return;
    }
    if (fields.some((field) => field.type === "dropdown" &&
      (!Array.isArray(field.options) || !field.options.some((option) => String(option).trim())))) {
      setError("Every dropdown needs at least one option.");
      return;
    }
    const ids = fields.map((field) => String(field.id));
    if (new Set(ids).size !== ids.length || ids.some((id) => !id)) {
      setError("Every field must have a unique ID.");
      return;
    }

    const cloudFields = fields.map((field) => ({
      id: String(field.id),
      type: field.type,
      label: field.label.trim(),
      placeholder: field.placeholder || "",
      options: field.type === "dropdown"
        ? field.options.map((option) => String(option).trim()).filter(Boolean)
        : [],
      required: Boolean(field.required),
      ...(field.pattern ? { pattern: field.pattern } : {}),
      showIf: field.showIf ?? null,
    }));

    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        title: cleanTitle,
        description: description.trim(),
        fields: cloudFields,
      };
      const savedForm = formId
        ? await updateUserForm(formId, payload)
        : await createUserForm(payload);

      const savedId = String(savedForm._id);
      setFormId(savedId);
      if (!editId) setSearchParams({ edit: savedId }, { replace: true });
      setMessage("Your form has been saved to Forma AI cloud.");
    } catch (err) {
      setError(err.message || "Unable to save your form.");
    } finally {
      setIsSaving(false);
    }
  }

  function renderPreviewField(field) {
    const common = {
      placeholder: field.placeholder || "",
      disabled: true,
    };

    switch (field.type) {
      case "email":
        return <input type="email" {...common} />;
      case "number":
        return <input type="number" {...common} />;
      case "phone":
        return (
          <PhoneInput
            id={field.id}
            name={field.id}
            value={previewValues[field.id] || ""}
            onChange={(value) =>
              setPreviewValues((current) => ({
                ...current,
                [field.id]: value,
              }))
            }
            required={Boolean(field.required)}
            disabled={false}
            placeholder={field.placeholder || "Enter phone number"}
          />
        );
      case "date":
        return <input type="date" {...common} />;
      case "textarea":
        return <textarea rows={3} {...common} />;
      case "checkbox":
        return (
          <label className="magic-preview-checkbox">
            <input type="checkbox" disabled />
            <span>{field.placeholder || "Select this option"}</span>
          </label>
        );
      case "dropdown":
        return (
          <select disabled defaultValue="">
            <option value="">Select an option</option>
            {(field.options || []).map((option, index) => (
              <option key={`${field.id}-${index}`}>{option}</option>
            ))}
          </select>
        );
      default:
        return <input type="text" {...common} />;
    }
  }

  return (
    <div className="magic-layout">
      <Sidebar />
      <main className="magic-main">
        <Header />
        <section className="magic-content">
          <div className="magic-heading">
            <div>
              <p className="magic-eyebrow">AI FORM GENERATOR</p>
              <h1>Build by Magic</h1>
              <p>Describe your idea and let AI create a form you can customize, preview and save.</p>
            </div>
            <button type="button" className="magic-back-button" onClick={() => navigate("/dashboard")}>
              Back to Dashboard
            </button>
          </div>

          <section className="magic-prompt-panel">
            <div className="magic-section-heading">
              <span className="magic-sparkle">✦</span>
              <div>
                <h2>What would you like to create?</h2>
                <p>Be as descriptive as you like.</p>
              </div>
            </div>

            <form onSubmit={handleGenerate}>
              <textarea
                className="magic-prompt-input"
                value={prompt}
                onChange={(event) => {
                  setPrompt(event.target.value);
                  setEnhancedPrompt("");
                  setMessage("");
                }}
                placeholder="Example: Create a student registration form with name, email, phone number, department, year of study and address..."
                maxLength={5000}
                rows={5}
              />
              <div className="magic-prompt-footer">
                <span>{prompt.length}/5000 characters</span>
                <div className="magic-prompt-actions">
                  <button
                    type="button"
                    className="magic-enhance-button"
                    onClick={handleEnhancePrompt}
                    disabled={isEnhancing || isGenerating || isModifying || !prompt.trim()}
                  >
                    {isEnhancing ? "Enhancing..." : "✦ Enhance Prompt"}
                  </button>
                  <button
                    type="submit"
                    className="magic-primary-button"
                    disabled={isGenerating || isEnhancing || isModifying || !prompt.trim()}
                  >
                    {isGenerating ? "Generating..." : "✦ Generate Form"}
                  </button>
                </div>
              </div>

              {enhancedPrompt && (
                <div className="magic-enhanced-panel">
                  <div className="magic-enhanced-heading">
                    <div>
                      <strong>Enhanced Prompt</strong>
                      <p>Review and edit the AI-improved specification.</p>
                    </div>
                    <span>AI IMPROVED</span>
                  </div>
                  <textarea
                    className="magic-enhanced-input"
                    value={enhancedPrompt}
                    onChange={(event) => setEnhancedPrompt(event.target.value)}
                    maxLength={5000}
                    rows={8}
                  />
                  <div className="magic-enhanced-footer">
                    <span>{enhancedPrompt.length}/5000 characters</span>
                    <div>
                      <button type="button" className="magic-enhance-button" onClick={() => setEnhancedPrompt("")}>
                        Discard
                      </button>
                      <button type="button" className="magic-primary-button" onClick={handleApplyEnhancedPrompt}>
                        Use Enhanced Prompt
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </section>

          {error && <p className="magic-feedback magic-error" role="alert">{error}</p>}
          {message && <p className="magic-feedback magic-success" role="status">{message}</p>}

          {isLoading ? (
            <div className="magic-empty-state">Loading your cloud form...</div>
          ) : (
            <section className="magic-workspace">
              <div className="magic-editor-panel">
                <div className="magic-panel-heading">
                  <div>
                    <p className="magic-eyebrow">FORM STUDIO</p>
                    <h2>Edit your form</h2>
                  </div>
                  <span className="magic-field-count">{fields.length} fields</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "18px", padding: "12px", border: "1px solid #e5e7eb", borderRadius: "10px", background: "#fafafa" }}>
                  <strong style={{ fontSize: "14px" }}>Edit history</strong>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      className="magic-enhance-button"
                      onClick={handleUndo}
                      disabled={historyIndex <= 0}
                      aria-label="Undo last form change"
                      title="Undo last form change"
                    >
                      ↶ Undo
                    </button>
                    <button
                      type="button"
                      className="magic-enhance-button"
                      onClick={handleRedo}
                      disabled={historyIndex >= history.length - 1}
                      aria-label="Redo form change"
                      title="Redo form change"
                    >
                      ↷ Redo
                    </button>
                  </div>
                </div>

                <form className="magic-ai-modify-panel" onSubmit={handleModifyForm}>
                  <label className="magic-label">
                    ✦ Ask AI to modify this form
                    <textarea
                      value={aiInstruction}
                      onChange={(event) => setAiInstruction(event.target.value)}
                      placeholder="Example: Add a date of birth field, make email required, and add a department dropdown with five options."
                      maxLength={2000}
                      rows={3}
                    />
                  </label>
                  <div className="magic-prompt-footer">
                    <span>{aiInstruction.length}/2000 characters</span>
                    <button
                      type="submit"
                      className="magic-primary-button"
                      disabled={isModifying || isSaving || isGenerating || !fields.length || !aiInstruction.trim()}
                    >
                      {isModifying ? "Modifying..." : "✦ Apply AI Changes"}
                    </button>
                  </div>
                </form>

                <label className="magic-label">
                  Form title
                  <input
                    value={formTitle}
                    onChange={(event) => commitEditorChange({
                      formTitle: event.target.value,
                      description,
                      fields,
                    })}
                    maxLength={150}
                    placeholder="Enter form title"
                  />
                </label>

                <label className="magic-label">
                  Description
                  <textarea
                    value={description}
                    onChange={(event) => commitEditorChange({
                      formTitle,
                      description: event.target.value,
                      fields,
                    })}
                    maxLength={2000}
                    rows={3}
                    placeholder="Describe your form"
                  />
                </label>

                <div className="magic-add-heading">
                  <h3>Add a field</h3>
                </div>
                <div className="magic-field-types">
                  {FIELD_TYPES.map((type) => (
                    <button type="button" key={type} onClick={() => addField(type)}>
                      + {FIELD_LABELS[type]}
                    </button>
                  ))}
                </div>

                <h3 className="magic-fields-title">Customize fields</h3>

                {fields.length === 0 ? (
                  <div className="magic-empty-state">Generate a form or add fields to start building.</div>
                ) : (
                  fields.map((field, index) => (
                    <article className="magic-field-editor" key={field.id}>
                      <div className="magic-field-editor-heading">
                        <strong>{index + 1}. {FIELD_LABELS[field.type] || field.type}</strong>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                          <button
                            type="button"
                            className="magic-enhance-button"
                            onClick={() => moveField(index, -1)}
                            disabled={index === 0}
                            aria-label={`Move ${field.label} up`}
                            title="Move up"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            className="magic-enhance-button"
                            onClick={() => moveField(index, 1)}
                            disabled={index === fields.length - 1}
                            aria-label={`Move ${field.label} down`}
                            title="Move down"
                          >
                            ↓
                          </button>
                          <button type="button" className="magic-enhance-button" onClick={() => duplicateField(field.id)}>
                            Duplicate
                          </button>
                          <button type="button" className="magic-remove-button" onClick={() => removeField(field.id)}>
                            Remove
                          </button>
                        </div>
                      </div>

                      <label className="magic-label">
                        Field type
                        <select
                          value={field.type}
                          onChange={(event) => {
                            const nextType = event.target.value;
                            commitEditorChange({
                              formTitle,
                              description,
                              fields: fields.map((item) =>
                                item.id === field.id
                                  ? {
                                      ...item,
                                      type: nextType,
                                      options: nextType === "dropdown" ? ["Option 1"] : [],
                                    }
                                  : item
                              ),
                            });
                          }}
                        >
                          {FIELD_TYPES.map((type) => (
                            <option key={type} value={type}>{FIELD_LABELS[type]}</option>
                          ))}
                        </select>
                      </label>

                      <label className="magic-label">
                        Field label
                        <input
                          value={field.label}
                          maxLength={150}
                          onChange={(event) => updateField(field.id, "label", event.target.value)}
                        />
                      </label>

                      <label className="magic-label">
                        Placeholder
                        <input
                          value={field.placeholder || ""}
                          onChange={(event) => updateField(field.id, "placeholder", event.target.value)}
                        />
                      </label>

                      {field.type === "dropdown" && (
                        <div className="magic-label">
                          <span>Dropdown options</span>
                          {(field.options || []).map((option, optionIndex) => (
                            <div className="magic-option-row" key={`${field.id}-option-${optionIndex}`}>
                              <input
                                value={option}
                                onChange={(event) => {
                                  const updated = [...field.options];
                                  updated[optionIndex] = event.target.value;
                                  updateField(field.id, "options", updated);
                                }}
                                aria-label={`Option ${optionIndex + 1}`}
                              />
                              <button
                                type="button"
                                onClick={() => updateField(
                                  field.id,
                                  "options",
                                  field.options.filter((_, position) => position !== optionIndex)
                                )}
                                aria-label={`Remove option ${optionIndex + 1}`}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            className="magic-add-option"
                            onClick={() => updateField(field.id, "options", [
                              ...(field.options || []),
                              `Option ${(field.options || []).length + 1}`,
                            ])}
                          >
                            + Add option
                          </button>
                        </div>
                      )}

                      <label className="magic-required-toggle">
                        <input
                          type="checkbox"
                          checked={Boolean(field.required)}
                          onChange={(event) => updateField(field.id, "required", event.target.checked)}
                        />
                        Required field
                      </label>
                    </article>
                  ))
                )}

                <button
                  type="button"
                  className="magic-primary-button magic-save-button"
                  onClick={handleSave}
                  disabled={isSaving || isLoading || isModifying || fields.length === 0}
                >
                  {isSaving ? "Saving..." : formId ? "Update Cloud Form" : "Save Draft to Cloud"}
                </button>
              </div>

              <div className="magic-preview-panel">
                <div className="magic-preview-heading">
                  <div>
                    <p className="magic-eyebrow">LIVE PREVIEW</p>
                    <h2>Preview your form</h2>
                  </div>
                  <div className="magic-preview-switch">
                    <button
                      type="button"
                      className={previewMode === "desktop" ? "active" : ""}
                      onClick={() => setPreviewMode("desktop")}
                    >
                      Desktop
                    </button>
                    <button
                      type="button"
                      className={previewMode === "mobile" ? "active" : ""}
                      onClick={() => setPreviewMode("mobile")}
                    >
                      Mobile
                    </button>
                  </div>
                </div>

                <div className={`magic-preview-frame ${previewMode}`}>
                  <div className="magic-preview-form">
                    <h2>{formTitle || "Untitled Form"}</h2>
                    <p>{description || "Your form description will appear here."}</p>
                    {fields.map((field) => (
                      <div className="magic-preview-field" key={field.id}>
                        <label>
                          {field.label || "Untitled Field"}
                          {field.required && <span className="magic-required-star"> *</span>}
                        </label>
                        {renderPreviewField(field)}
                      </div>
                    ))}
                    {fields.length > 0 && <button type="button" disabled>Submit</button>}
                    <span className="magic-preview-brand">Built with Forma AI</span>
                  </div>
                </div>
              </div>
            </section>
          )}
        </section>
      </main>
    </div>
  );
}

export default BuildByMagic;