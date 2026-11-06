const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    respondentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    respondentEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    formId: {
      type: String,
      required: true,
      index: true,
    },
    schemaVersion: {
      type: Number,
      required: true,
    },
    answers: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    aiMeta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ["draft", "submitted"],
      default: "draft",
    },
  },
  {
    timestamps: true,
    minimize: false,
  }
);

submissionSchema.index({ ownerId: 1, createdAt: -1 });
submissionSchema.index({ formId: 1, createdAt: -1 });

module.exports = mongoose.model("Submission", submissionSchema);