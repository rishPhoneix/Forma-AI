function leafMet(cond, values) {
  const actual = values[cond.field];
  const operator = cond.operator || "equals";
  switch (operator) {
    case "equals":
      return actual === cond.value;
    case "in":
      return Array.isArray(cond.value) && cond.value.includes(actual);
    default:
      // An operator we do not handle yet. Keep the field visible instead of
      // silently throwing the person's data away.
      console.warn(`showIf: unsupported operator "${operator}"`);
      return true;
  }
}

function isConditionMet(cond, values) {
  if (!cond) return true;
  if (cond.and) return cond.and.every((c) => isConditionMet(c, values));
  if (cond.or) return cond.or.some((c) => isConditionMet(c, values));
  return leafMet(cond, values);
}


function resolveVisibility(form, extracted) {
  const entries = [];
  for (const section of form.sections) {
    for (const field of section.fields) entries.push({ section, field });
  }

  let values = { ...extracted };
  while (true) {
    const visibleIds = new Set();
    for (const { section, field } of entries) {
      if (isConditionMet(section.showIf, values) && isConditionMet(field.showIf, values)) {
        visibleIds.add(field.id);
      }
    }

    const kept = {};
    for (const [id, value] of Object.entries(values)) {
      if (visibleIds.has(id)) kept[id] = value;
    }

    if (Object.keys(kept).length === Object.keys(values).length) {
      return { values: kept, visibleIds };
    }
    values = kept;
  }
}

module.exports = { resolveVisibility, isConditionMet };