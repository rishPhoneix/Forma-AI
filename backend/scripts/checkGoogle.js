require("dotenv").config();

const key = process.env.GOOGLE_API_KEY;
const base = "https://generativelanguage.googleapis.com/v1beta";
const model = process.env.LLM_MODEL || "gemini-3.8-flash";
const timeoutMs = Number(process.env.TIMEOUT_MS) || 20000;

async function call(label, url, options = {}) {
  const started = Date.now();
  try {
    const res = await fetch(url, { ...options, signal: AbortSignal.timeout(timeoutMs) });
    const text = await res.text();
    const secs = ((Date.now() - started) / 1000).toFixed(1);
    console.log(label, "-> HTTP", res.status, `(${secs}s)`);
    return { res, text };
  } catch (err) {
    const secs = ((Date.now() - started) / 1000).toFixed(1);
    const why = err.cause ? err.cause.code || err.cause.message : err.message;
    console.log(label, "-> FAILED:", err.name, why, `(${secs}s)`);
    return null;
  }
}

async function main() {
  if (!key) {
    console.error("GOOGLE_API_KEY is missing in backend/.env");
    process.exit(1);
  }

  console.log("Model:", model, "| timeout:", timeoutMs / 1000, "seconds");

  const gen = await call("Generate", `${base}/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      contents: [{ parts: [{ text: "Reply with one short sentence: what is a dynamic form?" }] }],
    }),
  });
  if (gen) console.log(gen.text.slice(0, 800));
}

main();