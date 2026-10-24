const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    formId: { type: String, required: true },
    schemaVersion: { type: Number, required: true },
    answers: { type: mongoose.Schema.Types.Mixed, default: {} },
    aiMeta: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: { type: String, enum: ["draft", "submitted"], default: "draft" },
  },
  { timestamps: true, minimize: false }
);

module.exports = mongoose.model("Submission", submissionSchema);