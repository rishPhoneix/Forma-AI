const mongoose = require("mongoose");
const UserForm = require("../models/UserForm");
const Activity = require("../models/Activity");

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

async function logActivity(ownerId, action, formId, formTitle) {
  try {
    await Activity.create({ ownerId, action, formId, formTitle });
  } catch (error) {
    console.error("Activity logging failed:", error.message);
  }
}

function validateFormData(data, partial = false) {
  const errors = [];

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { valid: false, errors: ["Invalid form data."] };
  }

  if (!partial || Object.prototype.hasOwnProperty.call(data, "title")) {
    if (
      typeof data.title !== "string" ||
      !data.title.trim() ||
      data.title.trim().length > 150
    ) {
      errors.push("Title is required and must not exceed 150 characters.");
    }
  }

  if (Object.prototype.hasOwnProperty.call(data, "description")) {
    if (
      typeof data.description !== "string" ||
      data.description.length > 2000
    ) {
      errors.push("Description must not exceed 2000 characters.");
    }
  }

  if (!partial || Object.prototype.hasOwnProperty.call(data, "fields")) {
    if (!Array.isArray(data.fields)) {
      errors.push("Fields must be an array.");
    } else {
      const fieldIds = new Set();

      data.fields.forEach((field, index) => {
        if (!field || typeof field !== "object" || Array.isArray(field)) {
          errors.push(`Invalid field at position ${index + 1}.`);
          return;
        }

        if (
          typeof field.id !== "string" ||
          !field.id.trim() ||
          fieldIds.has(field.id)
        ) {
          errors.push(`Invalid or duplicate field ID at position ${index + 1}.`);
        } else {
          fieldIds.add(field.id);
        }

        if (!FIELD_TYPES.includes(field.type)) {
          errors.push(`Unsupported field type at position ${index + 1}.`);
        }

        if (
          typeof field.label !== "string" ||
          !field.label.trim()
        ) {
          errors.push(`Field label is required at position ${index + 1}.`);
        }

        if (
          field.placeholder !== undefined &&
          typeof field.placeholder !== "string"
        ) {
          errors.push(`Invalid placeholder at position ${index + 1}.`);
        }

        if (
          field.options !== undefined &&
          (!Array.isArray(field.options) ||
            field.options.some((option) => typeof option !== "string"))
        ) {
          errors.push(`Invalid options at position ${index + 1}.`);
        }

        if (
          field.type === "dropdown" &&
          (!Array.isArray(field.options) || field.options.length === 0)
        ) {
          errors.push(`Dropdown must have at least one option at position ${index + 1}.`);
        }

        if (
          field.required !== undefined &&
          typeof field.required !== "boolean"
        ) {
          errors.push(`Invalid required value at position ${index + 1}.`);
        }
      });
    }
  }

  return { valid: errors.length === 0, errors };
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
      placeholder: field.placeholder,
      options: [...(field.options || [])],
      required: field.required,
      pattern: field.pattern,
      showIf: field.showIf,
    })),
    savedAt: new Date(),
  };
}

function sendValidationError(res, errors) {
  return res.status(400).json({
    message: "Form validation failed.",
    errors,
  });
}

exports.createForm = async (req, res) => {
  try {
    const validation = validateFormData(req.body);

    if (!validation.valid) {
      return sendValidationError(res, validation.errors);
    }

    const form = await UserForm.create({
      ownerId: req.user._id,
      title: req.body.title.trim(),
      description: req.body.description || "",
      fields: req.body.fields,
      version: 1,
      versionHistory: [],
    });

    form.versionHistory.push(createSnapshot(form));
    await form.save();

    await logActivity(
      req.user._id,
      "form.created",
      form._id,
      form.title
    );

    return res.status(201).json({
      message: "Form created successfully.",
      form,
    });
  } catch (error) {
    console.error("Create form error:", error);
    return res.status(500).json({
      message: "Failed to create form.",
    });
  }
};

exports.listMyForms = async (req, res) => {
  try {
    const forms = await UserForm.find({
      ownerId: req.user._id,
    })
      .select("-versionHistory")
      .sort({ updatedAt: -1 })
      .lean();

    return res.status(200).json({ forms });
  } catch (error) {
    console.error("List forms error:", error);
    return res.status(500).json({
      message: "Failed to fetch forms.",
    });
  }
};

exports.getMyForm = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid form ID." });
    }

    const form = await UserForm.findOne({
      _id: req.params.id,
      ownerId: req.user._id,
    }).lean();

    if (!form) {
      return res.status(404).json({ message: "Form not found." });
    }

    return res.status(200).json({ form });
  } catch (error) {
    console.error("Get form error:", error);
    return res.status(500).json({
      message: "Failed to fetch form.",
    });
  }
};

exports.updateForm = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid form ID." });
    }

    const validation = validateFormData(req.body, true);

    if (!validation.valid) {
      return sendValidationError(res, validation.errors);
    }

    const currentForm = await UserForm.findOne({
      _id: req.params.id,
      ownerId: req.user._id,
    }).lean();

    if (!currentForm) {
      return res.status(404).json({ message: "Form not found." });
    }

    const updates = {};

    if (Object.prototype.hasOwnProperty.call(req.body, "title")) {
      updates.title = req.body.title.trim();
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "description")) {
      updates.description = req.body.description;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "fields")) {
      updates.fields = req.body.fields;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "No valid form updates were provided.",
      });
    }

    const lastSnapshot =
      currentForm.versionHistory?.[currentForm.versionHistory.length - 1];

    const shouldSaveSnapshot =
      !lastSnapshot || lastSnapshot.version !== currentForm.version;

    const updateOperation = {
      $set: updates,
      $inc: { version: 1 },
    };

    if (shouldSaveSnapshot) {
      updateOperation.$push = {
        versionHistory: {
          $each: [createSnapshot(currentForm)],
          $slice: -MAX_HISTORY,
        },
      };
    }

    const updatedForm = await UserForm.findOneAndUpdate(
      {
        _id: req.params.id,
        ownerId: req.user._id,
        version: currentForm.version,
      },
      updateOperation,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedForm) {
      return res.status(409).json({
        message: "This form was modified elsewhere. Refresh and try again.",
      });
    }

    await logActivity(
      req.user._id,
      "form.updated",
      updatedForm._id,
      updatedForm.title
    );

    return res.status(200).json({
      message: "Form updated successfully.",
      form: updatedForm,
    });
  } catch (error) {
    console.error("Update form error:", error);
    return res.status(500).json({
      message: "Failed to update form.",
    });
  }
};

exports.getFormVersions = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid form ID." });
    }

    const form = await UserForm.findOne({
      _id: req.params.id,
      ownerId: req.user._id,
    })
      .select("version title versionHistory")
      .lean();

    if (!form) {
      return res.status(404).json({ message: "Form not found." });
    }

    const versions = (form.versionHistory || [])
      .map((snapshot) => ({
        version: snapshot.version,
        title: snapshot.title,
        description: snapshot.description,
        fieldCount: snapshot.fields.length,
        savedAt: snapshot.savedAt,
        isCurrent: snapshot.version === form.version,
      }))
      .sort((a, b) => b.version - a.version);

    return res.status(200).json({
      currentVersion: form.version,
      versions,
    });
  } catch (error) {
    console.error("Get form versions error:", error);
    return res.status(500).json({
      message: "Failed to fetch version history.",
    });
  }
};

exports.restoreFormVersion = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid form ID." });
    }

    const targetVersion = Number(req.params.version);

    if (!Number.isInteger(targetVersion) || targetVersion < 1) {
      return res.status(400).json({
        message: "Invalid version number.",
      });
    }

    const currentForm = await UserForm.findOne({
      _id: req.params.id,
      ownerId: req.user._id,
    }).lean();

    if (!currentForm) {
      return res.status(404).json({ message: "Form not found." });
    }

    const targetSnapshot = currentForm.versionHistory?.find(
      (snapshot) => snapshot.version === targetVersion
    );

    if (!targetSnapshot) {
      return res.status(404).json({
        message: "Requested version was not found in history.",
      });
    }

    if (targetVersion === currentForm.version) {
      return res.status(400).json({
        message: "This version is already current.",
      });
    }

    const lastSnapshot =
      currentForm.versionHistory?.[currentForm.versionHistory.length - 1];

    const shouldSaveSnapshot =
      !lastSnapshot || lastSnapshot.version !== currentForm.version;

    const updateOperation = {
      $set: {
        title: targetSnapshot.title,
        description: targetSnapshot.description,
        fields: targetSnapshot.fields,
      },
      $inc: { version: 1 },
    };

    if (shouldSaveSnapshot) {
      updateOperation.$push = {
        versionHistory: {
          $each: [createSnapshot(currentForm)],
          $slice: -MAX_HISTORY,
        },
      };
    }

    const restoredForm = await UserForm.findOneAndUpdate(
      {
        _id: req.params.id,
        ownerId: req.user._id,
        version: currentForm.version,
      },
      updateOperation,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!restoredForm) {
      return res.status(409).json({
        message: "This form was modified elsewhere. Refresh and try again.",
      });
    }

    await logActivity(
      req.user._id,
      "form.version_restored",
      restoredForm._id,
      restoredForm.title
    );

    return res.status(200).json({
      message: `Version ${targetVersion} restored successfully.`,
      form: restoredForm,
    });
  } catch (error) {
    console.error("Restore form version error:", error);
    return res.status(500).json({
      message: "Failed to restore form version.",
    });
  }
};

exports.deleteForm = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid form ID." });
    }

    const form = await UserForm.findOneAndDelete({
      _id: req.params.id,
      ownerId: req.user._id,
    });

    if (!form) {
      return res.status(404).json({ message: "Form not found." });
    }

    await logActivity(
      req.user._id,
      "form.deleted",
      form._id,
      form.title
    );

    return res.status(200).json({
      message: "Form deleted successfully.",
    });
  } catch (error) {
    console.error("Delete form error:", error);
    return res.status(500).json({
      message: "Failed to delete form.",
    });
  }
};

exports.updatePublishStatus = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid form ID." });
    }

    const { published } = req.body;

    if (typeof published !== "boolean") {
      return res.status(400).json({
        message: "Published must be a boolean value.",
      });
    }

    const form = await UserForm.findOne({
      _id: req.params.id,
      ownerId: req.user._id,
    });

    if (!form) {
      return res.status(404).json({ message: "Form not found." });
    }

    if (published && form.fields.length === 0) {
      return res.status(400).json({
        message: "Add at least one field before publishing.",
      });
    }

    if (form.status === (published ? "published" : "draft")) {
      return res.status(200).json({
        message: "Publish status is already up to date.",
        form,
      });
    }

    form.status = published ? "published" : "draft";
    form.publishedAt = published ? new Date() : null;

    await form.save();

    await logActivity(
      req.user._id,
      published ? "form.published" : "form.unpublished",
      form._id,
      form.title
    );

    return res.status(200).json({
      message: published
        ? "Form published successfully."
        : "Form unpublished successfully.",
      form,
    });
  } catch (error) {
    console.error("Publish form error:", error);
    return res.status(500).json({
      message: "Failed to update publish status.",
    });
  }
};