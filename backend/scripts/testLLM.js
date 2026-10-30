require("dotenv").config();

const TIMEOUT_MS = 30000;

async function main() {
  if (!process.env.GOOGLE_API_KEY) {
    console.error("GOOGLE_API_KEY is missing in backend/.env");
    process.exit(1);
  }

  const modelName = process.env.LLM_MODEL || "gemini-3.8-flash";
  console.log("Model:", modelName);

  const { ChatGoogle } = await import("@langchain/google");
  console.log("Package loaded");

  const model = new ChatGoogle(modelName);
  console.log("Calling model...");

  const call = model.invoke(
    "Reply with exactly one short sentence: what is a dynamic form?"
  );
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("No reply after 30 seconds")), TIMEOUT_MS)
  );

  const res = await Promise.race([call, timeout]);
  console.log("Reply:", JSON.stringify(res.content));
}

main().catch((err) => {
  console.error("LLM test failed:", err);
  process.exit(1);
});