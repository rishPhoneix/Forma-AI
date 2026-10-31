const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isRealDate(s) {
  if (!DATE_RE.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

function isValidValue(field, value) {
  switch (field.type) {
    case "number":
      return typeof value === "number" && Number.isFinite(value);
    case "checkbox":
      return typeof value === "boolean";
    case "dropdown": {
      if (typeof value !== "string" || value === "") return false;
      const options = field.options || [];
      return options.length === 0 || options.includes(value);
    }
    case "date":
      return typeof value === "string" && isRealDate(value);
    default: {
      // text, textarea
      if (typeof value !== "string" || value.trim() === "") return false;
      if (field.pattern) {
        try {
          return new RegExp(field.pattern).test(value);
        } catch {
          return true; // a bad pattern is rejected when the form is saved
        }
      }
      return true;
    }
  }
}


function validateValues(form, extracted) {
  const fields = new Map();
  for (const section of form.sections) {
    for (const field of section.fields) fields.set(field.id, field);
  }

  const values = {};
  const rejected = [];
  for (const [id, value] of Object.entries(extracted)) {
    const field = fields.get(id);
    if (field && isValidValue(field, value)) values[id] = value;
    else rejected.push(id);
  }
  return { values, rejected };
}

module.exports = { validateValues, isValidValue };