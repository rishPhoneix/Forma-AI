const FormSchema = require("../models/FormSchema");
const { validateFormPayload } = require("../validators/formValidator");

exports.listForms = async (req, res, next) => {
  try {
    const forms = await FormSchema.find({}, "formId title description version -_id")
      .sort({ title: 1 })
      .lean();
    res.json(forms);
  } catch (err) {
    next(err);
  }
};

exports.getForm = async (req, res, next) => {
  try {
    const form = await FormSchema.findOne({ formId: req.params.formId }, "-_id -__v").lean();
    if (!form) return res.status(404).json({ message: "Form not found" });
    res.json(form);
  } catch (err) {
    next(err);
  }
};


exports.createForm = async (req, res, next) => {
  try {
    const result = validateFormPayload(req.body);
    if (!result.ok) {
      return res.status(400).json({ message: "Invalid form schema", errors: result.errors });
    }
    const exists = await FormSchema.exists({ formId: result.data.formId });
    if (exists) {
      return res.status(409).json({ message: "A form with this formId already exists" });
    }
    const form = await FormSchema.create(result.data);
    res.status(201).json({ formId: form.formId, version: form.version });
  } catch (err) {
    next(err);
  }
};