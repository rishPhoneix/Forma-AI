const { GoogleGenAI } = require("@google/genai");

const client = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

const FIELD_TYPES = [
  "text",
  "email",
  "number",
  "phone",
  "dropdown",
  "date",
  "textarea",
  "checkbox",
];

const FORM_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING" },
    description: { type: "STRING" },
    fields: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          id: { type: "STRING" },
          type: { type: "STRING", enum: FIELD_TYPES },
          label: { type: "STRING" },
          placeholder: { type: "STRING" },
          options: {
            type: "ARRAY",
            items: { type: "STRING" },
          },
          required: { type: "BOOLEAN" },
        },
        required: [
          "id",
          "type",
          "label",
          "placeholder",
          "options",
          "required",
        ],
      },
    },
  },
  required: ["title", "description", "fields"],
};

function validateGeneratedForm(form) {
  const errors = [];

  if (!form || typeof form !== "object" || Array.isArray(form)) {
    return ["Generated response must be a form object"];
  }

  if (
    typeof form.title !== "string" ||
    !form.title.trim() ||
    form.title.trim().length > 150
  ) {
    errors.push("Generated form has an invalid title");
  }

  if (
    typeof form.description !== "string" ||
    form.description.length > 2000
  ) {
    errors.push("Generated form has an invalid description");
  }

  if (
    !Array.isArray(form.fields) ||
    form.fields.length === 0 ||
    form.fields.length > 50
  ) {
    errors.push("Form must contain between 1 and 50 fields");
    return errors;
  }

  const ids = new Set();

  form.fields.forEach((field, index) => {
    const position = index + 1;

    if (!field || typeof field !== "object" || Array.isArray(field)) {
      errors.push(`Field ${position} is invalid`);
      return;
    }

    const id = typeof field.id === "string" ? field.id.trim() : "";

    if (!id || ids.has(id)) {
      errors.push(`Field ${position} has an invalid or duplicate ID`);
    } else {
      ids.add(id);
    }

    if (!FIELD_TYPES.includes(field.type)) {
      errors.push(`Field ${position} has an unsupported type`);
    }

    if (
      typeof field.label !== "string" ||
      !field.label.trim() ||
      field.label.trim().length > 150
    ) {
      errors.push(`Field ${position} has an invalid label`);
    }

    if (typeof field.placeholder !== "string") {
      errors.push(`Field ${position} has an invalid placeholder`);
    }

    if (
      !Array.isArray(field.options) ||
      !field.options.every((option) => typeof option === "string")
    ) {
      errors.push(`Field ${position} has invalid options`);
    } else if (
      field.type === "dropdown" &&
      !field.options.some((option) => option.trim())
    ) {
      errors.push(`Dropdown field ${position} requires options`);
    }

    if (typeof field.required !== "boolean") {
      errors.push(`Field ${position} has an invalid required value`);
    }
  });

  return errors;
}

function normalizeGeneratedForm(form, existingFields = []) {
  const existingById = new Map(
    existingFields.map((field) => [String(field.id), field])
  );

  const usedIds = new Set();

  const fields = form.fields.map((field) => {
    const requestedId = String(field.id || "").trim();
    const existing = existingById.get(requestedId);

    let id = requestedId;

    if (!existing && usedIds.has(id)) {
      id = `field_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    }

    usedIds.add(id);

    return {
      id,
      type: field.type,
      label: field.label.trim(),
      placeholder: field.placeholder || "",
      options: field.type === "dropdown" ? field.options : [],
      required: field.required,
      ...(existing?.pattern ? { pattern: existing.pattern } : {}),
      showIf: existing?.showIf ?? null,
    };
  });

  return {
    title: form.title.trim(),
    description: form.description.trim(),
    fields,
  };
}

async function generateStructuredForm(prompt, existingForm = null) {
  const existingFields = existingForm?.fields || [];

  const response = await client.models.generateContent({
    model: process.env.LLM_MODEL || "gemini-3.5-flash-lite",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: existingForm
              ? `Modify this existing form according to the user's instruction.

CURRENT FORM:
${JSON.stringify(existingForm)}

USER INSTRUCTION:
${prompt}

Rules:
- Return the complete updated form.
- Preserve existing field IDs for fields that remain.
- Preserve fields not affected by the instruction.
- Use unique IDs for newly added fields.
- Do not remove fields unless requested.
- Keep the original intent unless explicitly changed.
- Use only supported field types.
- Use empty options arrays for non-dropdown fields.
- Dropdowns must have at least one non-empty option.
- Keep the form within 50 fields.
- Conditional logic is not supported.`
              : `Create a complete form based on these requirements:

${prompt}

Rules:
- Generate practical, clearly labelled fields.
- Use only supported field types.
- Add dropdown options when appropriate.
- Set required to true only for essential fields.
- Use unique IDs for every field.
- Do not invent unnecessary questions.
- Use empty options arrays for non-dropdown fields.
- Conditional logic is not supported.`,
          },
        ],
      },
    ],
    config: {
      systemInstruction:
        "You are Forma AI's structured form engine. Return only valid JSON matching the supplied schema. Never include markdown, explanations or additional properties. Supported field types: text, email, number, phone, dropdown, date, textarea and checkbox.",
      responseMimeType: "application/json",
      responseJsonSchema: FORM_RESPONSE_SCHEMA,
    },
  });

  const responseText = response.text?.trim();

  if (!responseText) {
    throw new Error("Gemini returned an empty form response");
  }

  let generatedForm;

  try {
    generatedForm = JSON.parse(responseText);
  } catch {
    throw new Error("AI returned an invalid form structure");
  }

  const errors = validateGeneratedForm(generatedForm);

  if (errors.length) {
    console.error("Form validation errors:", errors);
    throw new Error("AI generated an invalid form. Please try again.");
  }

  return normalizeGeneratedForm(generatedForm, existingFields);
}

const enhancePrompt = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (
      typeof prompt !== "string" ||
      !prompt.trim() ||
      prompt.trim().length > 5000
    ) {
      return res.status(400).json({
        message: "Prompt must contain between 1 and 5000 characters",
      });
    }

    const response = await client.models.generateContent({
      model: process.env.LLM_MODEL || "gemini-3.5-flash-lite",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Improve the following form creation request:

${prompt.trim()}

Rewrite it as a clear, detailed and structured specification for an AI form builder.

Preserve the user's intent and explicitly requested fields.
Organize fields logically.
Clarify mandatory fields.
Suggest sensible placeholders.
Do not invent facts or unnecessary fields.

Return only the improved form specification.`,
            },
          ],
        },
      ],
      config: {
        systemInstruction:
          "You are Forma AI's prompt enhancement engine. Return only the improved prompt, never JSON or explanations.",
      },
    });

    const enhancedPrompt = response.text?.trim();

    if (!enhancedPrompt || enhancedPrompt.length > 5000) {
      throw new Error("Invalid enhanced prompt response");
    }

    return res.status(200).json({
      message: "Prompt enhanced successfully",
      enhancedPrompt,
    });
  } catch (error) {
    console.error("Prompt Enhancement Error:", error.message);

    return res.status(502).json({
      message: "Unable to enhance your prompt right now. Please try again.",
    });
  }
};

const generateFormWithAI = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (
      typeof prompt !== "string" ||
      !prompt.trim() ||
      prompt.trim().length > 5000
    ) {
      return res.status(400).json({
        message: "Prompt must contain between 1 and 5000 characters",
      });
    }

    const form = await generateStructuredForm(prompt.trim());

    return res.status(200).json({
      message: "Form generated successfully",
      form,
    });
  } catch (error) {
    console.error("Build by Magic Generation Error:", error.message);

    return res.status(502).json({
      message: "Unable to generate a form right now. Please try again.",
    });
  }
};

const modifyForm = async (req, res) => {
  try {
    const { form, instruction } = req.body;

    if (
      !form ||
      typeof form !== "object" ||
      !Array.isArray(form.fields) ||
      form.fields.length === 0 ||
      form.fields.length > 50
    ) {
      return res.status(400).json({
        message: "A valid form with 1 to 50 fields is required",
      });
    }

    if (
      typeof instruction !== "string" ||
      !instruction.trim() ||
      instruction.trim().length > 2000
    ) {
      return res.status(400).json({
        message: "Instruction must contain between 1 and 2000 characters",
      });
    }

    const currentErrors = validateGeneratedForm(form);

    if (currentErrors.length) {
      return res.status(400).json({
        message: "Current form is invalid",
        errors: currentErrors,
      });
    }

    const modifiedForm = await generateStructuredForm(
      instruction.trim(),
      form
    );

    return res.status(200).json({
      message: "Form modified successfully",
      form: modifiedForm,
    });
  } catch (error) {
    console.error("Build by Magic Modification Error:", error.message);

    return res.status(502).json({
      message: "Unable to modify your form right now. Please try again.",
    });
  }
};

module.exports = {
  enhancePrompt,
  generateFormWithAI,
  modifyForm,
};