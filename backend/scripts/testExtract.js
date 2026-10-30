require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const FormSchema = require("../models/FormSchema");
const { buildZod } = require("../utils/buildZod");
const { getModel } = require("../services/llm");

const text =
  process.argv[2] ||
  "I hit a deer on I-95 yesterday in my Honda, and the windshield shattered.";

async function main() {
  await connectDB();
  const form = await FormSchema.findOne({ formId: "auto-insurance-claim" }).lean();
  if (!form) throw new Error("auto-insurance-claim not found. Run npm run seed.");

  const schema = buildZod(form);
  console.log("Fields in schema:", Object.keys(schema.shape).join(", "));

    const today = new Date().toLocaleDateString("en-CA");
  console.log("Today used:", today);
  const rules =
    "Extract insurance claim details from the user's text. " +
    "Only use what the text states. Use null for anything not stated. " +
    "Never guess. Pick dropdown values only from the allowed options. " +
    `Today's date is ${today}; convert words like 'yesterday' to YYYY-MM-DD.`;

  const model = await getModel();
  const structured = model.withStructuredOutput(schema);

  console.log("\nINPUT:", text);
  const started = Date.now();
  const values = await structured.invoke([
    ["system", rules],
    ["human", text],
  ]);
  const secs = ((Date.now() - started) / 1000).toFixed(1);
  console.log("OUTPUT:", JSON.stringify(values, null, 2), `(${secs}s)`);

  const missing = Object.keys(values).filter((k) => values[k] === null);
  console.log("MISSING (null):", missing.join(", "));
}

main()
  .catch((err) => {
    console.error("Extract test failed:", err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());