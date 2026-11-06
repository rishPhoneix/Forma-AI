const UserForm = require("../models/UserForm");
const Activity = require("../models/Activity");

const FIELD_TYPES = [
  "text",
  "email",
  "number",
  "dropdown",
  "date",
  "textarea",
  "checkbox",
];

async function logActivity(ownerId, action, form) {
  try {
    await Activity.create({
      ownerId,
      action,
      formId: String(form._id),
      formTitle: form.title,
    });
  } catch (err) {
    console.error("Activity logging failed:", err.message);
  }
}

function validateFormData(data, partial = false) {
  const errors = [];

  if (!partial || data.title !== undefined) {
    if (typeof data.title !== "string" || !data.title.trim()) {
      errors.push("A valid form title is required");
    } else if (data.title.trim().length > 150) {
      errors.push("Form title cannot exceed 150 characters");
    }
  }

  if (!partial || data.description !== undefined) {
    if (
      data.description !== undefined &&
      (typeof data.description !== "string" ||
        data.description.length > 2000)
    ) {
      errors.push("Description cannot exceed 2000 characters");
    }
  }

  if (!partial || data.fields !== undefined) {
    if (!Array.isArray(data.fields)) {
      errors.push("Fields must be an array");
    } else {
      const ids = new Set();

      data.fields.forEach((field, index) => {
        if (!field || typeof field !== "object" || Array.isArray(field)) {
          errors.push(`Invalid field at position ${index + 1}`);
          return;
        }

        if (typeof field.id !== "string" || !field.id.trim()) {
          errors.push(`Field ${index + 1} requires an ID`);
        } else if (ids.has(field.id)) {
          errors.push(`Duplicate field ID: ${field.id}`);
        } else {
          ids.add(field.id);
        }

        if (!FIELD_TYPES.includes(field.type)) {
          errors.push(`Invalid field type at position ${index + 1}`);
        }

        if (
          typeof field.label !== "string" ||
          !field.label.trim() ||
          field.label.length > 150
        ) {
          errors.push(`Field ${index + 1} requires a valid label`);
        }

        if (
          field.placeholder !== undefined &&
          typeof field.placeholder !== "string"
        ) {
          errors.push(`Invalid placeholder for field ${index + 1}`);
        }

        if (
          field.required !== undefined &&
          typeof field.required !== "boolean"
        ) {
          errors.push(`Invalid required value for field ${index + 1}`);
        }

        if (
          field.options !== undefined &&
          (!Array.isArray(field.options) ||
            !field.options.every(
              (option) => typeof option === "string"
            ))
        ) {
          errors.push(`Invalid options for field ${index + 1}`);
        }

        if (
          field.type === "dropdown" &&
          (!Array.isArray(field.options) || field.options.length === 0)
        ) {
          errors.push(`Dropdown field ${index + 1} requires options`);
        }

        if (
          field.pattern !== undefined &&
          typeof field.pattern !== "string"
        ) {
          errors.push(`Invalid pattern for field ${index + 1}`);
        }
      });
    }
  }

  return errors;
}

exports.createForm = async (req, res, next) => {
  try {
    const errors = validateFormData(req.body);

    if (errors.length) {
      return res.status(400).json({
        message: "Invalid form data",
        errors,
      });
    }

    const form = await UserForm.create({
      ownerId: req.user._id,
      title: req.body.title.trim(),
      description: req.body.description || "",
      fields: req.body.fields,
    });

    await logActivity(req.user._id, "form.created", form);

    res.status(201).json({
      message: "Form created successfully",
      form,
    });
  } catch (err) {
    next(err);
  }
};

exports.listMyForms = async (req, res, next) => {
  try {
    const forms = await UserForm.find({
      ownerId: req.user._id,
    })
      .sort({ updatedAt: -1 })
      .lean();

    res.json(forms);
  } catch (err) {
    next(err);
  }
};

exports.getMyForm = async (req, res, next) => {
  try {
    const form = await UserForm.findOne({
      _id: req.params.id,
      ownerId: req.user._id,
    }).lean();

    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }

    res.json(form);
  } catch (err) {
    next(err);
  }
};

exports.updateForm = async (req, res, next) => {
  try {
    const errors = validateFormData(req.body, true);

    if (errors.length) {
      return res.status(400).json({
        message: "Invalid form data",
        errors,
      });
    }

    const updates = {};

    if (req.body.title !== undefined) {
      updates.title = req.body.title.trim();
    }

    if (req.body.description !== undefined) {
      updates.description = req.body.description;
    }

    if (req.body.fields !== undefined) {
      updates.fields = req.body.fields;
    }

    const form = await UserForm.findOneAndUpdate(
      {
        _id: req.params.id,
        ownerId: req.user._id,
      },
      {
        $set: updates,
        $inc: { version: 1 },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }

    await logActivity(req.user._id, "form.updated", form);

    res.json({
      message: "Form updated successfully",
      form,
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteForm = async (req, res, next) => {
  try {
    const form = await UserForm.findOneAndDelete({
      _id: req.params.id,
      ownerId: req.user._id,
    });

    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }

    await logActivity(req.user._id, "form.deleted", form);

    res.json({ message: "Form deleted successfully" });
  } catch (err) {
    next(err);
  }
};

exports.updatePublishStatus = async (req, res, next) => {
  try {
    if (typeof req.body.published !== "boolean") {
      return res.status(400).json({
        message: "Published must be a boolean",
      });
    }

    const form = await UserForm.findOne({
      _id: req.params.id,
      ownerId: req.user._id,
    });

    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }

    if (req.body.published && form.fields.length === 0) {
      return res.status(400).json({
        message: "Add at least one field before publishing",
      });
    }

    const previousStatus = form.status;

    form.status = req.body.published ? "published" : "draft";
    form.publishedAt = req.body.published ? new Date() : null;

    await form.save();

    if (previousStatus !== form.status) {
      const action = req.body.published
        ? "form.published"
        : "form.unpublished";

      await logActivity(req.user._id, action, form);
    }

    res.json({
      message: `Form ${form.status} successfully`,
      form,
    });
  } catch (err) {
    next(err);
  }
};