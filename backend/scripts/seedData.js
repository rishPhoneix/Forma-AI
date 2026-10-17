const insuranceClaim = {
  formId: "auto-insurance-claim",
  title: "Auto Insurance Claim",
  description: "Report an accident, theft or damage involving your vehicle.",
  version: 1,
  sections: [
    {
      id: "incident",
      title: "What happened",
      fields: [
        {
          id: "incidentType",
          type: "dropdown",
          label: "Type of incident",
          required: true,
          options: ["animal_collision", "vehicle_collision", "theft", "weather_damage"],
        },
        { id: "incidentDate", type: "date", label: "Date of incident", required: true },
        { id: "location", type: "text", label: "Where did it happen?", required: true },
        {
          id: "animalType",
          type: "dropdown",
          label: "Which animal was involved?",
          required: true,
          options: ["deer", "dog", "other"],
          showIf: { field: "incidentType", operator: "equals", value: "animal_collision" },
        },
        {
          id: "otherAnimal",
          type: "text",
          label: "Describe the animal",
          required: true,
          showIf: { field: "animalType", operator: "equals", value: "other" },
        },
      ],
    },
    {
      id: "vehicle",
      title: "Your vehicle",
      fields: [
        { id: "vehicleMake", type: "text", label: "Make", required: true },
        { id: "vehicleModel", type: "text", label: "Model", required: true },
        {
          id: "vehicleDrivable",
          type: "dropdown",
          label: "Can the vehicle be driven?",
          required: true,
          options: ["yes", "no"],
        },
        {
          id: "needsTow",
          type: "dropdown",
          label: "Do you need a tow?",
          required: true,
          options: ["yes", "no"],
          showIf: { field: "vehicleDrivable", operator: "equals", value: "no" },
        },
        {
          id: "towLocation",
          type: "text",
          label: "Where should the vehicle be towed?",
          required: true,
          showIf: { field: "needsTow", operator: "equals", value: "yes" },
        },
      ],
    },
    {
      id: "damage",
      title: "Damage",
      fields: [
        {
          id: "damageArea",
          type: "dropdown",
          label: "Main damaged area",
          required: true,
          options: ["windshield", "bumper", "hood", "side_panel", "other"],
        },
        { id: "damageDescription", type: "textarea", label: "Describe the damage" },
      ],
    },
    {
      id: "injuries",
      title: "Injuries and police report",
      fields: [
        {
          id: "anyInjuries",
          type: "dropdown",
          label: "Was anyone injured?",
          required: true,
          options: ["yes", "no"],
        },
        {
          id: "injuryDetails",
          type: "textarea",
          label: "Describe the injuries",
          required: true,
          showIf: { field: "anyInjuries", operator: "equals", value: "yes" },
        },
        {
          id: "policeReportNumber",
          type: "text",
          label: "Police report number",
          showIf: {
            field: "incidentType",
            operator: "in",
            value: ["vehicle_collision", "theft", "animal_collision"],
          },
        },
      ],
    },
  ],
};

const healthIntake = {
  formId: "health-intake",
  title: "Patient Intake",
  description: "Basic details before your appointment.",
  version: 1,
  sections: [
    {
      id: "basics",
      title: "Basic details",
      fields: [
        { id: "fullName", type: "text", label: "Full name", required: true },
        { id: "age", type: "number", label: "Age", required: true },
        {
          id: "phone",
          type: "text",
          label: "Phone number (10 digits)",
          required: true,
          pattern: "^[0-9]{10}$",
        },
        {
          id: "hasAllergies",
          type: "dropdown",
          label: "Do you have any allergies?",
          required: true,
          options: ["yes", "no"],
        },
        {
          id: "allergyDetails",
          type: "textarea",
          label: "List your allergies",
          required: true,
          showIf: { field: "hasAllergies", operator: "equals", value: "yes" },
        },
      ],
    },
  ],
};

module.exports = [insuranceClaim, healthIntake];