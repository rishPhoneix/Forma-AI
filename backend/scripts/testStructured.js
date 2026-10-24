require("dotenv").config();
const { z } = require("zod");
const { getModel } = require("../services/llm");

const schema = z.object({
  incidentType: z
    .enum(["animal_collision", "rear_end", "theft", "other"])
    .nullable(),
  vehicleMake: z.string().nullable(),
  damageArea: z.enum(["windshield", "bumper", "door", "other"]).nullable(),
});

const rules =
  "Extract insurance claim details from the user's text. " +
  "Only use what the text states. Use null for anything not stated. " +
  "Never guess. Pick enum values only from the allowed options. " +
  "Use 'other' only when the text clearly describes something that is not " +
  "one of the listed options. If the text does not say, use null.";

const cases = [
  {
    text: "I hit a deer on I-95 yesterday in my Honda, and the windshield shattered.",
    expect: "animal_collision, Honda, windshield",
  },
  { text: "My car was damaged.", expect: "null, null, null" },
  {
    text: "Someone stole my Toyota last night.",
    expect: "theft, Toyota, null",
  },
  {
    text: "A truck hit me from behind and my bumper is crushed.",
    expect: "rear_end, null, bumper",
  },
  {
    text: "I hit a deer on I-95 yesterday in my Honda, and the windshield shattered.",
    expect: "same as case 1 (repeat run)",
  },
];

async function main() {
  const model = await getModel();
  const structured = model.withStructuredOutput(schema);

  for (const c of cases) {
    console.log("\nINPUT:", c.text);
    console.log("EXPECT:", c.expect);
    const started = Date.now();
    const result = await Promise.race([
      structured.invoke([
        ["system", rules],
        ["human", c.text],
      ]),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("No reply after 60 seconds")), 60000)
      ),
    ]);
    const secs = ((Date.now() - started) / 1000).toFixed(1);
    console.log("OUTPUT:", JSON.stringify(result), `(${secs}s)`);
  }
}

main().catch((err) => {
  console.error("Structured test failed:", err);
  process.exit(1);
});