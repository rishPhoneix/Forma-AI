const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const FormSchema = require("../models/FormSchema");
const { validateFormPayload } = require("../validators/formValidator");
const seedForms = require("./seedData");

async function seed() {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is not set in .env");
  await mongoose.connect(process.env.MONGO_URI);

  for (const form of seedForms) {
    const result = validateFormPayload(form);
    if (!result.ok) {
      console.error(`Seed data for "${form.formId}" is invalid:`, result.errors);
      process.exit(1);
    }
    await FormSchema.findOneAndUpdate({ formId: form.formId }, result.data, {
      upsert: true,
      returnDocument: "after",
      setDefaultsOnInsert: true,
    });
    console.log(`Seeded: ${form.formId}`);
  }

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seeding failed:", err.message);
  process.exit(1);
});