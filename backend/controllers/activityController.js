const Activity = require("../models/Activity");

const ALLOWED_ACTIONS = [
  "form.created",
  "form.updated",
  "form.published",
  "form.unpublished",
  "form.deleted",
  "submission.received",
];

exports.createActivity = async (req, res, next) => {
  try {
    const {
      action,
      formId = "",
      formTitle = "",
      metadata = {},
    } = req.body;

    if (!ALLOWED_ACTIONS.includes(action)) {
      return res.status(400).json({
        message: "Invalid activity action",
      });
    }

    if (
      typeof formId !== "string" ||
      typeof formTitle !== "string" ||
      !metadata ||
      typeof metadata !== "object" ||
      Array.isArray(metadata)
    ) {
      return res.status(400).json({
        message: "Invalid activity data",
      });
    }

    const activity = await Activity.create({
      ownerId: req.user._id,
      action,
      formId,
      formTitle,
      metadata,
    });

    res.status(201).json({
      message: "Activity recorded successfully",
      activity,
    });
  } catch (err) {
    next(err);
  }
};

exports.listMyActivities = async (req, res, next) => {
  try {
    const activities = await Activity.find({
      ownerId: req.user._id,
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json(activities);
  } catch (err) {
    next(err);
  }
};