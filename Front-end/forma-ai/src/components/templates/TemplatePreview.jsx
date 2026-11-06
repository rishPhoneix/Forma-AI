import "./TemplatePreview.css";

function getFieldTypeLabel(type) {
  const labels = {
    text: "Short answer",
    number: "Number",
    date: "Date",
    dropdown: "Dropdown",
    checkbox: "Checkbox",
    textarea: "Long answer",
  };

  return labels[type] || type;
}

function TemplatePreview({ schema }) {
  if (!schema || !Array.isArray(schema.sections)) {
    return (
      <div className="template-preview template-preview-empty">
        <span>Preview unavailable</span>
      </div>
    );
  }

  const sections = schema.sections;
  const fields = sections.flatMap((section) =>
    Array.isArray(section.fields) ? section.fields : []
  );

  const visibleFields = fields.slice(0, 4);
  const remainingFields = Math.max(fields.length - visibleFields.length, 0);

  return (
    <div className="template-preview">
      <div className="template-preview-header">
        <div className="template-preview-brand">
          <span className="template-preview-brand-mark">F</span>
          <span>FORMA AI</span>
        </div>
        <span className="template-preview-version">
          V{schema.version || 1}
        </span>
      </div>

      <div className="template-preview-content">
        <div className="template-preview-intro">
          <span className="template-preview-kicker">FORM PREVIEW</span>
          <h4>{schema.title}</h4>
          <p>{schema.description}</p>
        </div>

        <div className="template-preview-progress">
          <span />
        </div>

        <div className="template-preview-fields">
          {sections.map((section, sectionIndex) => {
            const sectionFields = (section.fields || []).filter((field) =>
              visibleFields.some((visibleField) => visibleField.id === field.id)
            );

            if (sectionFields.length === 0) return null;

            return (
              <div className="template-preview-section" key={section.id || sectionIndex}>
                <span className="template-preview-section-title">
                  {section.title}
                </span>

                {sectionFields.map((field) => (
                  <div className="template-preview-field" key={field.id}>
                    <div className="template-preview-field-heading">
                      <span>{field.label}</span>
                      {field.required && (
                        <span className="template-preview-required">*</span>
                      )}
                    </div>

                    <div className={`template-preview-input preview-${field.type}`}>
                      {field.type === "dropdown" ? (
                        <>
                          <span>Select an option</span>
                          <span>⌄</span>
                        </>
                      ) : field.type === "textarea" ? (
                        <span>Enter your response...</span>
                      ) : field.type === "checkbox" ? (
                        <span className="template-preview-checkbox" />
                      ) : field.type === "date" ? (
                        <span>DD / MM / YYYY</span>
                      ) : field.type === "number" ? (
                        <span>Enter a number</span>
                      ) : (
                        <span>Enter your answer...</span>
                      )}
                    </div>

                    {field.showIf && (
                      <span className="template-preview-conditional">
                        Conditional field
                      </span>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {remainingFields > 0 && (
          <div className="template-preview-more">
            + {remainingFields} more questions
          </div>
        )}
      </div>

      <div className="template-preview-footer">
        <span>{sections.length} sections</span>
        <span>{fields.length} questions</span>
      </div>
    </div>
  );
}

export default TemplatePreview;