const assert = require("assert");
const seedForms = require("./seedData");
const { resolveVisibility } = require("../utils/showIf");

const form = seedForms.find((f) => f.formId === "auto-insurance-claim");
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

check("theft hides animal, tow and injury fields and drops stray values", () => {
  const { values, visibleIds } = resolveVisibility(form, {
    incidentType: "theft",
    animalType: "deer",
    otherAnimal: "fox",
    towLocation: "Elm Street",
  });
  assert.deepStrictEqual(values, { incidentType: "theft" });
  for (const id of ["animalType", "otherAnimal", "needsTow", "towLocation", "injuryDetails"]) {
    assert.ok(!visibleIds.has(id), `${id} should be hidden`);
  }
  assert.ok(visibleIds.has("policeReportNumber"), "policeReportNumber should be visible for theft");
});

check("animal_collision + other keeps animalType and otherAnimal", () => {
  const { values, visibleIds } = resolveVisibility(form, {
    incidentType: "animal_collision",
    animalType: "other",
    otherAnimal: "fox",
  });
  assert.deepStrictEqual(values, {
    incidentType: "animal_collision",
    animalType: "other",
    otherAnimal: "fox",
  });
  assert.ok(visibleIds.has("otherAnimal"));
});

check("animal_collision + deer drops otherAnimal", () => {
  const { values, visibleIds } = resolveVisibility(form, {
    incidentType: "animal_collision",
    animalType: "deer",
    otherAnimal: "fox",
  });
  assert.deepStrictEqual(values, { incidentType: "animal_collision", animalType: "deer" });
  assert.ok(!visibleIds.has("otherAnimal"));
});

check("chain: drivable=yes hides needsTow, which then hides towLocation", () => {
  const { values, visibleIds } = resolveVisibility(form, {
    vehicleDrivable: "yes",
    needsTow: "yes",
    towLocation: "Elm Street",
  });
  assert.deepStrictEqual(values, { vehicleDrivable: "yes" });
  assert.ok(!visibleIds.has("needsTow"));
  assert.ok(!visibleIds.has("towLocation"));
});

check("chain: drivable=no + needsTow=yes keeps towLocation", () => {
  const { values, visibleIds } = resolveVisibility(form, {
    vehicleDrivable: "no",
    needsTow: "yes",
    towLocation: "Elm Street",
  });
  assert.deepStrictEqual(values, {
    vehicleDrivable: "no",
    needsTow: "yes",
    towLocation: "Elm Street",
  });
  assert.ok(visibleIds.has("towLocation"));
});

check("'in' operator: weather_damage hides policeReportNumber, vehicle_collision shows it", () => {
  const weather = resolveVisibility(form, { incidentType: "weather_damage" });
  assert.ok(!weather.visibleIds.has("policeReportNumber"));
  const collision = resolveVisibility(form, { incidentType: "vehicle_collision" });
  assert.ok(collision.visibleIds.has("policeReportNumber"));
});

check("no incidentType: animalType is hidden, always-visible fields stay visible", () => {
  const { visibleIds } = resolveVisibility(form, {});
  assert.ok(!visibleIds.has("animalType"));
  assert.ok(visibleIds.has("incidentDate"));
  assert.ok(visibleIds.has("anyInjuries"));
});

console.log(`\n${passed} passed`);