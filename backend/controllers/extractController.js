const { z } = require("zod");
const { extract, ExtractionError } = require("../services/extractionService");

const MAX_TEXT_LENGTH = 2000;

const bodySchema = z.object({
  formId: z.string().trim().min(1, "formId is required"),
  text: z
    .string()
    .trim()
    .min(1, "text is required")
    .max(MAX_TEXT_LENGTH, `text must be at most ${MAX_TEXT_LENGTH} characters`),
  today: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "today must look like YYYY-MM-DD")
    .optional(),
});

exports.extractValues = async (req, res, next) => {
  try {
    const parsed = bodySchema.safeParse(req.body || {});
    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
      return res.status(400).json({ message: "Invalid request", errors });
    }

    const { formId, text, today } = parsed.data;
   
    const result = await extract({
      formId,
      text,
      today: today || new Date().toLocaleDateString("en-CA"),
    });
    res.json(result);
  } catch (err) {
    if (err instanceof ExtractionError) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
};