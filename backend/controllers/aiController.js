const mongoose = require("mongoose");
const { GoogleGenAI } = require("@google/genai");
const Conversation = require("../models/Conversation");
const UserForm = require("../models/UserForm");
const Activity = require("../models/Activity");

const client = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

const PRIMARY_MODEL =
  process.env.LLM_MODEL || "gemini-3.5-flash-lite";

const FALLBACK_MODEL =
  process.env.LLM_FALLBACK_MODEL || "gemini-3.8-flash";

const MAX_ATTEMPTS_PER_MODEL = 2;
const RETRY_BASE_DELAY = 1000;

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

const MAX_HISTORY = 50;

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

const NOVA_ACTION_SCHEMA = {
  type: "OBJECT",
  properties: {
    action: {
      type: "STRING",
      enum: ["chat", "create_form", "update_form"],
    },
    reply: { type: "STRING" },
    targetFormId: { type: "STRING" },
    form: FORM_RESPONSE_SCHEMA,
  },
  required: ["action", "reply", "targetFormId", "form"],
};

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(error) {
  const status = Number(error.status || error.code);

  const retryableStatuses = [
    408,
    429,
    500,
    502,
    503,
    504,
  ];

  if (retryableStatuses.includes(status)) {
    return true;
  }

  const errorCode = String(error.code || "").toUpperCase();

  const retryableCodes = [
    "ECONNRESET",
    "ECONNREFUSED",
    "ETIMEDOUT",
    "EPIPE",
    "ENOTFOUND",
    "EAI_AGAIN",
  ];

  if (retryableCodes.includes(errorCode)) {
    return true;
  }

  const message = String(error.message || "").toLowerCase();

  return (
    message.includes("high demand") ||
    message.includes("temporarily unavailable") ||
    message.includes("resource exhausted") ||
    message.includes("rate limit") ||
    message.includes("service unavailable") ||
    message.includes("internal server error") ||
    message.includes("timeout")
  );
}

async function generateWithFallback(config, operationName) {
  const models = [...new Set([
    PRIMARY_MODEL,
    FALLBACK_MODEL,
  ])];

  let lastError = null;

  for (let modelIndex = 0; modelIndex < models.length; modelIndex++) {
    const model = models[modelIndex];

    for (
      let attempt = 1;
      attempt <= MAX_ATTEMPTS_PER_MODEL;
      attempt++
    ) {
      try {
        console.log(
          `[${operationName}] Using ${model} (attempt ${attempt}/${MAX_ATTEMPTS_PER_MODEL})`
        );

        const response = await client.models.generateContent({
          ...config,
          model,
        });

        console.log(
          `[${operationName}] Success using ${model}`
        );

        return response;
      } catch (error) {
        lastError = error;

        console.error(
          `[${operationName}] ${model} failed:`,
          {
            status: error.status,
            code: error.code,
            message: error.message,
            attempt,
          }
        );

        if (!isRetryableError(error)) {
          throw error;
        }

        if (attempt < MAX_ATTEMPTS_PER_MODEL) {
          const waitTime =
            RETRY_BASE_DELAY * Math.pow(2, attempt - 1);

          console.log(
            `[${operationName}] Retrying in ${waitTime}ms`
          );

          await delay(waitTime);
        }
      }
    }

    if (modelIndex < models.length - 1) {
      console.warn(
        `[${operationName}] Primary model unavailable. Switching to fallback: ${models[modelIndex + 1]}`
      );
    }
  }

  throw lastError || new Error("All Gemini models failed.");
}

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
    errors.push("Generated form must contain between 1 and 50 fields");
    return errors;
  }

  const ids = new Set();

  form.fields.forEach((field, index) => {
    const position = index + 1;

    if (!field || typeof field !== "object" || Array.isArray(field)) {
      errors.push(`Field ${position} is invalid`);
      return;
    }

    if (
      typeof field.id !== "string" ||
      !field.id.trim() ||
      ids.has(field.id.trim())
    ) {
      errors.push(`Field ${position} has an invalid or duplicate ID`);
    } else {
      ids.add(field.id.trim());
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

    if (
      typeof field.placeholder !== "string" ||
      field.placeholder.length > 500
    ) {
      errors.push(`Field ${position} has an invalid placeholder`);
    }

    if (
      !Array.isArray(field.options) ||
      !field.options.every(
        (option) => typeof option === "string" && option.length <= 200
      )
    ) {
      errors.push(`Field ${position} has invalid options`);
    }

    if (
      field.type === "dropdown" &&
      (!Array.isArray(field.options) || field.options.length === 0)
    ) {
      errors.push(`Dropdown field ${position} requires options`);
    }

    if (typeof field.required !== "boolean") {
      errors.push(`Field ${position} has an invalid required value`);
    }
  });

  return errors;
}

function normalizeForm(form) {
  return {
    title: form.title.trim(),
    description: form.description.trim(),
    fields: form.fields.map((field) => ({
      id: field.id.trim(),
      type: field.type,
      label: field.label.trim(),
      placeholder: field.placeholder,
      options: field.options,
      required: field.required,
      pattern: undefined,
      showIf: null,
    })),
  };
}

function createSnapshot(form) {
  return {
    version: form.version,
    title: form.title,
    description: form.description,
    fields: form.fields.map((field) => ({
      id: field.id,
      type: field.type,
      label: field.label,
      placeholder: field.placeholder || "",
      options: [...(field.options || [])],
      required: field.required,
      pattern: field.pattern,
      showIf: field.showIf,
    })),
    savedAt: new Date(),
  };
}

async function logNOVAActivity(ownerId, action, form) {
  try {
    await Activity.create({
      ownerId,
      action,
      formId: form._id,
      formTitle: form.title,
    });
  } catch (error) {
    console.error("NOVA activity logging failed:", error.message);
  }
}

async function createNOVAForm(ownerId, generatedForm) {
  const form = await UserForm.create({
    ownerId,
    title: generatedForm.title,
    description: generatedForm.description,
    fields: generatedForm.fields,
    status: "draft",
    version: 1,
    versionHistory: [],
  });

  form.versionHistory.push(createSnapshot(form));
  await form.save();

  await logNOVAActivity(ownerId, "form.created", form);

  return form;
}

async function updateNOVAForm(ownerId, targetFormId, generatedForm) {
  if (!mongoose.isValidObjectId(targetFormId)) {
    throw new Error("NOVA returned an invalid form ID.");
  }

  const currentForm = await UserForm.findOne({
    _id: targetFormId,
    ownerId,
  }).lean();

  if (!currentForm) {
    throw new Error("The selected form was not found or is not accessible.");
  }

  const lastSnapshot =
    currentForm.versionHistory?.[currentForm.versionHistory.length - 1];

  const updateOperation = {
    $set: {
      title: generatedForm.title,
      description: generatedForm.description,
      fields: generatedForm.fields,
    },
    $inc: { version: 1 },
  };

  if (!lastSnapshot || lastSnapshot.version !== currentForm.version) {
    updateOperation.$push = {
      versionHistory: {
        $each: [createSnapshot(currentForm)],
        $slice: -MAX_HISTORY,
      },
    };
  }

  const updatedForm = await UserForm.findOneAndUpdate(
    {
      _id: targetFormId,
      ownerId,
      version: currentForm.version,
    },
    updateOperation,
    {
      returnDocument: "after",
      runValidators: true,
    }
  );

  if (!updatedForm) {
    throw new Error(
      "This form was modified elsewhere. Refresh and try again."
    );
  }

  await logNOVAActivity(ownerId, "form.updated", updatedForm);

  return updatedForm;
}

function getFormContext(forms) {
  return forms.map((form) => ({
    id: form._id.toString(),
    title: form.title,
    description: form.description,
    status: form.status,
    fields: form.fields.map((field) => ({
      id: field.id,
      type: field.type,
      label: field.label,
      placeholder: field.placeholder,
      options: field.options || [],
      required: field.required,
    })),
  }));
}

const chatWithNOVA = async (req, res) => {
  try {
    const { conversationId, message } = req.body;

    if (!mongoose.isValidObjectId(conversationId)) {
      return res.status(400).json({
        message: "Invalid conversation ID",
      });
    }

    if (
      typeof message !== "string" ||
      !message.trim() ||
      message.trim().length > 5000
    ) {
      return res.status(400).json({
        message: "Message must contain between 1 and 5000 characters",
      });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    const userMessage = message.trim();

    const [forms] = await Promise.all([
      UserForm.find({ ownerId: req.user._id })
        .select("title description fields status version updatedAt")
        .sort({ updatedAt: -1 })
        .limit(30)
        .lean(),
    ]);

    const history = conversation.messages.slice(-20).map((item) => ({
      role: item.role === "assistant" ? "model" : "user",
      parts: [{ text: item.content }],
    }));

    history.push({
      role: "user",
      parts: [{ text: userMessage }],
    });

    const response = await generateWithFallback(
      {
        contents: history,
        config: {
          systemInstruction: `You are NOVA, the intelligent AI assistant inside Forma AI.

Help users create forms, modify their existing forms, understand data, solve problems, and improve workflows.

You must return a structured response matching the supplied JSON schema.

AVAILABLE ACTIONS:

1. chat:
Use for normal conversation, questions, explanations, greetings, and requests that do not clearly require a form database operation.
If the user wants to modify a form but the target is ambiguous, ask a clarification question in reply. Do not guess.

2. create_form:
Use when the user clearly requests a new form.
Generate the complete form in the form property.
Use unique field IDs.
Use only supported field types.
Set dropdown options appropriately.
Set required to true only for essential fields.
Set an empty targetFormId.

3. update_form:
Use when the user clearly requests changes to an existing form.
Only select a targetFormId from the user's available forms below.
Return the COMPLETE updated form, including all existing fields that should remain.
Preserve existing field IDs unless a field is intentionally replaced.
Add, remove, reorder, or update fields according to the user's request.
Never invent an ID or select a form that is not listed.
If the requested form cannot be identified confidently, use chat and ask which form the user means.

IMPORTANT:
- Never claim a form was saved or modified. The application backend performs database operations after validating your response.
- Do not perform form actions for hypothetical examples or general questions.
- Keep replies concise and clear.
- For chat actions, return an empty form with title and description as empty strings and fields as an empty array.
- For create_form and update_form, return the complete form.
- For create_form, targetFormId MUST be an empty string.
- For update_form, targetFormId MUST be an ID from the available forms.
- Use "phone", never "tel", for phone fields.
- Never use unsupported field types.
- Do not include markdown in structured data.

SUPPORTED FIELD TYPES:
${FIELD_TYPES.join(", ")}

USER'S AVAILABLE FORMS:
${JSON.stringify(getFormContext(forms))}`,
          responseMimeType: "application/json",
          responseJsonSchema: NOVA_ACTION_SCHEMA,
        },
      },
      "NOVA Chat"
    );

    const responseText = response.text?.trim();

    if (!responseText) {
      throw new Error("Gemini returned an empty response");
    }

    let novaResult;

    try {
      novaResult = JSON.parse(responseText);
    } catch {
      throw new Error("NOVA returned an invalid structured response.");
    }

    if (
      !novaResult ||
      !["chat", "create_form", "update_form"].includes(novaResult.action) ||
      typeof novaResult.reply !== "string"
    ) {
      throw new Error("NOVA returned an invalid action.");
    }

    let savedForm = null;
    let action = novaResult.action;

    if (action === "create_form" || action === "update_form") {
      const validationErrors = validateGeneratedForm(novaResult.form);

      if (validationErrors.length > 0) {
        console.error("NOVA form validation failed:", validationErrors);

        return res.status(502).json({
          message: "NOVA generated an invalid form. Please try again.",
          errors: validationErrors,
        });
      }

      if (
        action === "create_form" &&
        novaResult.targetFormId !== ""
      ) {
        return res.status(502).json({
          message: "NOVA returned an invalid target form ID.",
        });
      }

      const normalizedForm = normalizeForm(novaResult.form);

      if (action === "create_form") {
        savedForm = await createNOVAForm(req.user._id, normalizedForm);
      } else {
        const allowedFormIds = new Set(
          forms.map((form) => form._id.toString())
        );

        if (!allowedFormIds.has(novaResult.targetFormId)) {
          return res.status(400).json({
            message: "NOVA selected an unavailable form. Please identify the form again.",
          });
        }

        savedForm = await updateNOVAForm(
          req.user._id,
          novaResult.targetFormId,
          normalizedForm
        );
      }
    }

    const assistantReply = novaResult.reply.trim();

    if (!assistantReply) {
      throw new Error("NOVA returned an empty reply");
    }

    conversation.messages.push(
      {
        role: "user",
        content: userMessage,
      },
      {
        role: "assistant",
        content: assistantReply,
      }
    );

    if (
      conversation.title === "New conversation" &&
      conversation.messages.length === 2
    ) {
      conversation.title = userMessage.slice(0, 60);
    }

    await conversation.save();

    return res.status(200).json({
      conversation,
      reply: assistantReply,
      action,
      form: savedForm,
    });
  } catch (error) {
    console.error("NOVA Error:", {
      status: error.status,
      code: error.code,
      message: error.message,
    });

    if (error.message?.includes("modified elsewhere")) {
      return res.status(409).json({
        message: error.message,
      });
    }

    if (
      error.message?.includes("not found or is not accessible") ||
      error.message?.includes("invalid form ID")
    ) {
      return res.status(404).json({
        message: error.message,
      });
    }

    return res.status(502).json({
      message: "NOVA is temporarily unavailable. Please try again.",
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

    const response = await generateWithFallback(
      {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Create a complete form based on these requirements:

${prompt.trim()}

Return a practical form with clearly labelled fields.
Use only the supported field types.
Use dropdown options when appropriate.
Set required to true only for essential fields.
Use unique IDs for every field.
Do not invent unnecessary questions.
Return an empty options array for non-dropdown fields.
Set showIf logic to null; conditional logic is not supported yet.`,
              },
            ],
          },
        ],
        config: {
          systemInstruction:
            "You are Forma AI's structured form-generation engine. Generate professional, relevant forms. Return only data matching the supplied JSON schema. Never include markdown, explanations, or additional properties. Supported field types are text, email, number, phone, dropdown, date, textarea, and checkbox. Use phone, never tel.",
          responseMimeType: "application/json",
          responseJsonSchema: FORM_RESPONSE_SCHEMA,
        },
      },
      "AI Form Generation"
    );

    const responseText = response.text?.trim();

    if (!responseText) {
      throw new Error("Gemini returned an empty form response");
    }

    let generatedForm;

    try {
      generatedForm = JSON.parse(responseText);
    } catch {
      console.error("Gemini returned invalid JSON");

      return res.status(502).json({
        message: "AI returned an invalid form structure. Please try again.",
      });
    }

    const errors = validateGeneratedForm(generatedForm);

    if (errors.length > 0) {
      console.error("AI form validation failed:", errors);

      return res.status(502).json({
        message: "AI generated an invalid form. Please try again.",
        errors,
      });
    }

    const form = normalizeForm(generatedForm);

    return res.status(200).json({
      message: "Form generated successfully",
      form,
    });
  } catch (error) {
    console.error("AI Form Generation Error:", {
      status: error.status,
      code: error.code,
      message: error.message,
    });

    return res.status(502).json({
      message: "Unable to generate a form right now. Please try again.",
    });
  }
};

module.exports = {
  chatWithNOVA,
  generateFormWithAI,
};