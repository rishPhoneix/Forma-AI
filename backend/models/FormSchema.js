const mongoose = require("mongoose");
const { FIELD_TYPES } = require("../utils/formConstants");

const fieldSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    type: { type: String, required: true, enum: FIELD_TYPES },
    label: { type: String, required: true },
    options: { type: [String], default: [] },
    required: { type: Boolean, default: false },
    pattern: { type: String },
    showIf: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { _id: false, id: false }
);

const sectionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    showIf: { type: mongoose.Schema.Types.Mixed, default: null },
    fields: { type: [fieldSchema], default: [] },
  },
  { _id: false, id: false }
);

const formSchema = new mongoose.Schema(
  {
    formId: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    version: { type: Number, default: 1, min: 1 },
    sections: { type: [sectionSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FormSchema", formSchema);