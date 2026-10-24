const PROVIDERS = {
  gemini: async () => {
    const { ChatGoogle } = await import("@langchain/google");
    return new ChatGoogle(process.env.LLM_MODEL || "gemini-3.5-flash-lite");
  },
};

async function getModel() {
  const provider = (process.env.LLM_PROVIDER || "gemini").toLowerCase();
  const create = PROVIDERS[provider];
  if (!create) {
    throw new Error(
      `Unknown LLM_PROVIDER "${provider}". Supported: ${Object.keys(PROVIDERS).join(", ")}`
    );
  }
  return create();
}

module.exports = { getModel };