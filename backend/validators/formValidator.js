const { z } = require("zod");
const { FIELD_TYPES, OPERATORS } = require("../utils/formConstants");

const leafCondition = z.object({
  field: z.string().min(1),
  operator: z.enum(OPERATORS).default("equals"),
  value: z.any(),
});

const condition = z.lazy(() =>
  z.union([
    leafCondition,
    z.object({ and: z.array(condition).min(1) }),
    z.object({ or: z.array(condition).min(1) }),
  ])
);

const idRule = z
  .string()
  .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, "must start with a letter and use only letters, numbers, underscore");

const fieldZ = z.object({
  id: idRule,
  type: z.enum(FIELD_TYPES),
  label: z.string().min(1),
  options: z.array(z.string().min(1)).optional(),
  required: z.boolean().optional(),
  pattern: z.string().optional(),
  showIf: condition.nullable().optional(),
});

const sectionZ = z.object({
  id: idRule,
  title: z.string().min(1),
  showIf: condition.nullable().optional(),
  fields: z.array(fieldZ).min(1),
});

const formZ = z.object({
  formId: z.string().regex(/^[a-z0-9-]+$/, "use lowercase letters, numbers and hyphens"),
  title: z.string().min(1),
  description: z.string().optional(),
  version: z.number().int().min(1).optional(),
  sections: z.array(sectionZ).min(1),
});

function collectRefs(cond, out) {
  if (!cond) return;
  if (cond.field) out.push(cond.field);
  if (cond.and) cond.and.forEach((c) => collectRefs(c, out));
  if (cond.or) cond.or.forEach((c) => collectRefs(c, out));
}

function validateFormPayload(body) {
  const parsed = formZ.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
    };
  }

  const data = parsed.data;
  const errors = [];
  const knownIds = new Set();

  data.sections.forEach((s) =>
    s.fields.forEach((f) => {
      if (knownIds.has(f.id)) errors.push(`Duplicate field id: ${f.id}`);
      knownIds.add(f.id);
    })
  );

  data.sections.forEach((s) => {
    const sectionRefs = [];
    collectRefs(s.showIf, sectionRefs);
    sectionRefs.forEach((r) => {
      if (!knownIds.has(r)) errors.push(`Section "${s.id}" showIf refers to unknown field: ${r}`);
    });

    s.fields.forEach((f) => {
      if (f.type === "dropdown" && (!f.options || f.options.length === 0)) {
        errors.push(`Field "${f.id}" is a dropdown and needs options`);
      }
      if (f.pattern) {
        try {
          new RegExp(f.pattern);
        } catch {
          errors.push(`Field "${f.id}" has an invalid pattern`);
        }
      }
      const refs = [];
      collectRefs(f.showIf, refs);
      refs.forEach((r) => {
        if (r === f.id) errors.push(`Field "${f.id}" cannot depend on itself`);
        else if (!knownIds.has(r)) errors.push(`Field "${f.id}" showIf refers to unknown field: ${r}`);
      });
    });
  });

  if (errors.length) return { ok: false, errors };
  return { ok: true, data };
}

module.exports = { validateFormPayload };