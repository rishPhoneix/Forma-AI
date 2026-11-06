import { useState } from "react";
import TemplateArtwork from "./TemplateArtwork";
import TemplatePreview from "./TemplatePreview";
import "./TemplateCard.css";

function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function TemplateCard({ template, schema, loading, onUse }) {
  const [showPreview, setShowPreview] = useState(false);

  const sections = schema?.sections || [];
  const fields = sections.flatMap((section) =>
    Array.isArray(section.fields) ? section.fields : []
  );

  const conditionalCount = fields.filter((field) => field.showIf).length;

  return (
    <article className="template-card">
      <TemplateArtwork
        formId={template.formId}
        title={template.title}
        schema={schema}
      />

      <div className="template-card-body">
        <div className="template-card-category-row">
          <span className="template-category">FORM TEMPLATE</span>

          {schema && (
            <span className="template-version">
              Version {schema.version || 1}
            </span>
          )}
        </div>

        <h3>{template.title}</h3>

        <p className="template-card-description">
          {template.description || "A ready-made form to get you started."}
        </p>

        <div className="template-card-metadata">
          <span>
            {schema ? pluralize(sections.length, "section") : "Sections —"}
          </span>

          <span>
            {schema ? pluralize(fields.length, "question") : "Questions —"}
          </span>

          <span>
            {schema
              ? pluralize(conditionalCount, "conditional field")
              : "Conditional fields —"}
          </span>
        </div>

        <button
          type="button"
          className="template-preview-toggle"
          onClick={() => setShowPreview((current) => !current)}
          aria-expanded={showPreview}
          disabled={loading || !schema}
        >
          {loading
            ? "Loading preview..."
            : showPreview
              ? "Hide preview"
              : "Preview form"}

          <span>{showPreview ? "−" : "+"}</span>
        </button>

        {showPreview && schema && (
          <div className="template-card-preview">
            <TemplatePreview schema={schema} />
          </div>
        )}

        <button
          type="button"
          className="template-use-button"
          onClick={() => onUse(template.formId)}
        >
          <span>Use Template</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </article>
  );
}

export default TemplateCard;