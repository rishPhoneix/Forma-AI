const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    formId: {
      type: String,
      default: "",
    },
    formTitle: {
      type: String,
      default: "",
      trim: true,
      maxlength: 150,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    minimize: false,
  }
);

activitySchema.index({ ownerId: 1, createdAt: -1 });

module.exports = mongoose.model("Activity", activitySchema);