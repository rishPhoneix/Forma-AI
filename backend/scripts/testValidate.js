const assert = require("assert");
const { validateValues } = require("../utils/validateValues");
const { resolveVisibility } = require("../utils/showIf");

const form = {
  sections: [
    {
      id: "basics",
      fields: [
        { id: "age", type: "number" },
        { id: "phone", type: "text", pattern: "^[0-9]{10}$" },
        { id: "visitDate", type: "date" },
        { id: "hasAllergies", type: "dropdown", options: ["yes", "no"] },
        { id: "allergyDetails", type: "textarea", showIf: { field: "hasAllergies", operator: "equals", value: "yes" } },
        { id: "agreed", type: "checkbox" },
        { id: "guardianName", type: "text", showIf: { field: "age", operator: "lt", value: 18 } },
        { id: "seniorNote", type: "text", showIf: { field: "age", operator: "gt", value: 64 } },
        { id: "notNo", type: "text", showIf: { field: "hasAllergies", operator: "notEquals", value: "no" } },
      ],
    },
  ],
};

let passed = 0;
function check(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`PASS  ${name}`);
  } catch (err) {
    console.error(`FAIL  ${name}\n      ${err.message}`);
    process.exitCode = 1;
  }
}

check("phone that matches the pattern is kept", () => {
  const { values, rejected } = validateValues(form, { phone: "9876543210" });
  assert.deepStrictEqual(values, { phone: "9876543210" });
  assert.deepStrictEqual(rejected, []);
});

check("phone that breaks the pattern is rejected", () => {
  const { values, rejected } = validateValues(form, { phone: "12345" });
  assert.deepStrictEqual(values, {});
  assert.deepStrictEqual(rejected, ["phone"]);
});

check("dates: real ISO dates kept, bad formats and impossible dates rejected", () => {
  assert.deepStrictEqual(validateValues(form, { visitDate: "2026-10-28" }).values, { visitDate: "2026-10-28" });
  for (const bad of ["28/10/2026", "2026-13-45", "2026-02-30", "yesterday"]) {
    assert.deepStrictEqual(validateValues(form, { visitDate: bad }).rejected, ["visitDate"], bad);
  }
});

check("dropdown value outside the options is rejected", () => {
  assert.deepStrictEqual(validateValues(form, { hasAllergies: "maybe" }).rejected, ["hasAllergies"]);
  assert.deepStrictEqual(validateValues(form, { hasAllergies: "yes" }).values, { hasAllergies: "yes" });
});

check("number and checkbox types are enforced", () => {
  assert.deepStrictEqual(validateValues(form, { age: 25 }).values, { age: 25 });
  assert.deepStrictEqual(validateValues(form, { age: "25" }).rejected, ["age"]);
  assert.deepStrictEqual(validateValues(form, { agreed: true }).values, { agreed: true });
  assert.deepStrictEqual(validateValues(form, { agreed: "yes" }).rejected, ["agreed"]);
});

check("empty or blank text is rejected, unknown fields are rejected", () => {
  assert.deepStrictEqual(validateValues(form, { allergyDetails: "   " }).rejected, ["allergyDetails"]);
  assert.deepStrictEqual(validateValues(form, { notAField: "x" }).rejected, ["notAField"]);
});

check("invalid controlling value is dropped, so the field it controlled is hidden", () => {
  const { values } = validateValues(form, { hasAllergies: "maybe", allergyDetails: "peanuts" });
  const resolved = resolveVisibility(form, values);
  assert.deepStrictEqual(resolved.values, {});
  assert.ok(!resolved.visibleIds.has("allergyDetails"));
});

check("lt operator: age 15 shows guardianName, age 30 hides it", () => {
  assert.ok(resolveVisibility(form, { age: 15 }).visibleIds.has("guardianName"));
  assert.ok(!resolveVisibility(form, { age: 30 }).visibleIds.has("guardianName"));
  assert.ok(!resolveVisibility(form, {}).visibleIds.has("guardianName"));
});

check("gt operator: age 70 shows seniorNote, age 30 hides it and drops its value", () => {
  assert.ok(resolveVisibility(form, { age: 70 }).visibleIds.has("seniorNote"));
  const r = resolveVisibility(form, { age: 30, seniorNote: "x" });
  assert.deepStrictEqual(r.values, { age: 30 });
});

check("notEquals operator: hidden only when the value equals the excluded one", () => {
  assert.ok(!resolveVisibility(form, { hasAllergies: "no" }).visibleIds.has("notNo"));
  assert.ok(resolveVisibility(form, { hasAllergies: "yes" }).visibleIds.has("notNo"));
});

console.log(`\n${passed} passed`);