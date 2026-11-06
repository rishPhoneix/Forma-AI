const mongoose = require("mongoose");

const FIELD_TYPES = [
  "text",
  "email",
  "number",
  "dropdown",
  "date",
  "textarea",
  "checkbox",
];

const userFormFieldSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: FIELD_TYPES,
    },
    label: { type: String, required: true, trim: true },
    placeholder: { type: String, default: "" },
    options: { type: [String], default: [] },
    required: { type: Boolean, default: false },
    pattern: { type: String },
    showIf: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { _id: false, id: false }
);

const userFormSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
    },
    fields: {
      type: [userFormFieldSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
    version: {
      type: Number,
      default: 1,
      min: 1,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    minimize: false,
  }
);

userFormSchema.index({ ownerId: 1, updatedAt: -1 });

module.exports = mongoose.model("UserForm", userFormSchema);