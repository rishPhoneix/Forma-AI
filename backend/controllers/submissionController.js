const mongoose = require("mongoose");
const UserForm = require("../models/UserForm");
const Submission = require("../models/Submission");
const Activity = require("../models/Activity");
const { isConditionMet } = require("../utils/showIf");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isRealDate(value) {
  if (typeof value !== "string" || !DATE_RE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value;
}

function isValidValue(field, value) {
  switch (field.type) {
    case "text":
    case "textarea":
      return typeof value === "string" &&
        value.trim().length > 0 &&
        (!field.pattern || new RegExp(field.pattern).test(value));
    case "email":
      return typeof value === "string" && EMAIL_RE.test(value);
    case "number":
      return typeof value === "number" && Number.isFinite(value);
    case "dropdown":
      return typeof value === "string" &&
        field.options.includes(value);
    case "date":
      return isRealDate(value);
    case "checkbox":
      return typeof value === "boolean";
    default:
      return false;
  }
}

function validateAnswers(fields, answers) {
  const errors = [];
  const fieldMap = new Map(fields.map((field) => [field.id, field]));

  for (const id of Object.keys(answers)) {
    if (!fieldMap.has(id)) {
      errors.push(`Unknown field: ${id}`);
    }
  }

  const visibleFields = fields.filter((field) =>
    isConditionMet(field.showIf, answers)
  );

  const validatedAnswers = {};

  for (const field of visibleFields) {
    const value = answers[field.id];

    if (value === undefined || value === null || value === "") {
      if (field.required) {
        errors.push(`${field.label} is required`);
      }
      continue;
    }

    try {
      if (!isValidValue(field, value)) {
        errors.push(`${field.label} has an invalid value`);
        continue;
      }
    } catch {
      errors.push(`${field.label} has an invalid validation pattern`);
      continue;
    }

    validatedAnswers[field.id] = value;
  }

  return { errors, answers: validatedAnswers };
}

exports.createSubmission = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: "Form not found" });
    }

    const form = await UserForm.findOne({
      _id: id,
      status: "published",
    }).lean();

    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }

    const answers = req.body.answers;

    if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
      return res.status(400).json({
        message: "Answers must be an object",
      });
    }

    const result = validateAnswers(form.fields, answers);

    if (result.errors.length) {
      return res.status(400).json({
        message: "Submission validation failed",
        errors: result.errors,
      });
    }

    const respondentEmail =
      typeof req.body.respondentEmail === "string"
        ? req.body.respondentEmail.trim().toLowerCase()
        : "";

    if (respondentEmail && !EMAIL_RE.test(respondentEmail)) {
      return res.status(400).json({
        message: "Invalid respondent email",
      });
    }

    const submission = await Submission.create({
      ownerId: form.ownerId,
      respondentId: req.user?._id || null,
      respondentEmail,
      userId: null,
      formId: String(form._id),
      schemaVersion: form.version,
      answers: result.answers,
      aiMeta: {},
      status: "submitted",
    });

    try {
      await Activity.create({
        ownerId: form.ownerId,
        action: "submission.received",
        formId: String(form._id),
        formTitle: form.title,
        metadata: {
          submissionId: String(submission._id),
        },
      });
    } catch (activityError) {
      console.error("Activity logging failed:", activityError.message);
    }

    res.status(201).json({
      message: "Response submitted successfully",
      submission: {
        id: String(submission._id),
        formId: submission.formId,
        status: submission.status,
        submittedAt: submission.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.listMySubmissions = async (req, res, next) => {
  try {
    const submissions = await Submission.find({
      ownerId: req.user._id,
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json(submissions);
  } catch (err) {
    next(err);
  }
};

exports.getMySubmission = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: "Submission not found" });
    }

    const submission = await Submission.findOne({
      _id: req.params.id,
      ownerId: req.user._id,
    }).lean();

    if (!submission) {
      return res.status(404).json({
        message: "Submission not found",
      });
    }

    res.json(submission);
  } catch (err) {
    next(err);
  }
};