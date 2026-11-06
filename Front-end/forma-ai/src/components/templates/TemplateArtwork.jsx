import "./TemplateArtwork.css";

function getArtworkVariant(formId, title, schema) {
  const identity = `${formId || ""} ${title || ""}`.toLowerCase();

  const fields = (schema?.sections || []).flatMap((section) =>
    Array.isArray(section.fields) ? section.fields : []
  );

  const fieldIdentity = fields
    .map((field) => `${field.id || ""} ${field.label || ""}`)
    .join(" ")
    .toLowerCase();

  const content = `${identity} ${fieldIdentity}`;

  if (/insurance|claim|vehicle|incident|damage|accident/.test(content)) {
    return "insurance";
  }

  if (/health|patient|medical|allerg|appointment|symptom/.test(content)) {
    return "healthcare";
  }

  if (/feedback|rating|satisfaction|review|testimonial/.test(content)) {
    return "feedback";
  }

  if (/registration|register|signup|sign.?up|account|profile/.test(content)) {
    return "registration";
  }

  if (/application|applicant|eligibility|admission|enrollment/.test(content)) {
    return "application";
  }

  return "general";
}

const artworkNumbers = {
  insurance: "01",
  healthcare: "02",
  feedback: "03",
  registration: "04",
  application: "05",
  general: "06",
};

const artworkLabels = {
  insurance: "CLAIM REPORT",
  healthcare: "PATIENT PROFILE",
  feedback: "YOUR FEEDBACK",
  registration: "NEW REGISTRATION",
  application: "APPLICATION",
  general: "SMART FORM",
};

function TemplateArtwork({ formId, title, schema }) {
  const variant = getArtworkVariant(formId, title, schema);
  const isInsurance = variant === "insurance";
  const isHealthcare = variant === "healthcare";

  return (
    <div className={`template-artwork artwork-${variant}`}>
      <div className="artwork-glow" />

      <div className="artwork-heading">
        <span className="artwork-label">FORMA AI · TEMPLATE</span>
        <span className="artwork-symbol">{artworkNumbers[variant]}</span>
      </div>

      {isInsurance && (
        <div className="artwork-insurance">
          <div className="artwork-document">
            <div className="artwork-document-top">
              <span className="artwork-document-icon">F</span>
              <span>CLAIM REPORT</span>
            </div>
            <svg viewBox="0 0 300 125" role="img" aria-label="Vehicle illustration">
              <path d="M39 78 L53 48 Q58 37 72 35 L198 35 Q212 35 221 49 L247 78" />
              <path d="M28 79 Q28 70 40 70 L248 70 Q264 70 268 83 L268 99 L27 99 Z" />
              <path d="M69 49 L85 39 L132 39 L132 68 L55 68 Z" />
              <path d="M141 39 L195 39 Q207 39 215 51 L226 68 L141 68 Z" />
              <circle cx="75" cy="99" r="15" />
              <circle cx="218" cy="99" r="15" />
              <circle cx="75" cy="99" r="5" />
              <circle cx="218" cy="99" r="5" />
            </svg>
            <div className="artwork-document-lines"><span /><span /><span /></div>
          </div>
          <div className="artwork-floating-tag">Claim details</div>
        </div>
      )}

      {isHealthcare && (
        <div className="artwork-healthcare">
          <div className="artwork-health-card">
            <div className="artwork-health-icon">
              <svg viewBox="0 0 100 100" role="img" aria-label="Healthcare cross">
                <path d="M40 16 H60 V40 H84 V60 H60 V84 H40 V60 H16 V40 H40 Z" />
              </svg>
            </div>
            <div className="artwork-health-lines"><span /><span /><span /></div>
            <div className="artwork-health-bottom">
              <span>Patient profile</span>
              <span className="artwork-health-dot" />
            </div>
          </div>
          <div className="artwork-floating-tag">Patient intake</div>
        </div>
      )}

      {variant === "feedback" && (
        <div className="artwork-general">
          <div className="artwork-general-sheet">
            <div className="artwork-general-icon">★</div>
            <span className="artwork-general-line" />
            <span className="artwork-general-line short" />
            <div className="artwork-general-input" />
            <div className="artwork-general-input" />
            <div className="artwork-general-action" />
          </div>
          <div className="artwork-floating-tag">Your opinion</div>
        </div>
      )}

      {variant === "registration" && (
        <div className="artwork-general">
          <div className="artwork-general-sheet">
            <div className="artwork-general-icon">+</div>
            <span className="artwork-general-line" />
            <span className="artwork-general-line short" />
            <div className="artwork-general-input" />
            <div className="artwork-general-input" />
            <div className="artwork-general-action" />
          </div>
          <div className="artwork-floating-tag">New profile</div>
        </div>
      )}

      {variant === "application" && (
        <div className="artwork-general">
          <div className="artwork-general-sheet">
            <div className="artwork-general-icon">✓</div>
            <span className="artwork-general-line" />
            <span className="artwork-general-line short" />
            <div className="artwork-general-input" />
            <div className="artwork-general-input" />
            <div className="artwork-general-action" />
          </div>
          <div className="artwork-floating-tag">Application form</div>
        </div>
      )}

      {variant === "general" && (
        <div className="artwork-general">
          <div className="artwork-general-sheet">
            <div className="artwork-general-icon">F</div>
            <span className="artwork-general-line" />
            <span className="artwork-general-line short" />
            <div className="artwork-general-input" />
            <div className="artwork-general-input" />
            <div className="artwork-general-action" />
          </div>
          <div className="artwork-floating-tag">Smart form</div>
        </div>
      )}

      <div className="artwork-caption">
        <span>{artworkLabels[variant]}</span>
        <span className="artwork-caption-mark">✦</span>
      </div>
    </div>
  );
}

export default TemplateArtwork;