const { z } = require("zod");

function fieldToZod(field) {
  let schema;
  switch (field.type) {
    case "number":
      schema = z.number();
      break;
    case "checkbox":
      schema = z.boolean();
      break;
    case "dropdown":
      schema =
        field.options && field.options.length > 0 ? z.enum(field.options) : z.string();
      break;
    default:
      schema = z.string(); // text, textarea, date
  }
  const hint = field.type === "date" ? `${field.label} (format YYYY-MM-DD)` : field.label;
  return schema.nullable().describe(hint);
}

function buildZod(form) {
  const shape = {};
  for (const section of form.sections) {
    for (const field of section.fields) {
      shape[field.id] = fieldToZod(field);
    }
  }
  return z.object(shape);
}

module.exports = { buildZod };