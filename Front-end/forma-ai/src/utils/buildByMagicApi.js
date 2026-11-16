import { apiFetch } from "./api";

export async function enhanceMagicPrompt(prompt) {
  if (typeof prompt !== "string" || !prompt.trim()) {
    throw new Error("Please describe the form you want to create.");
  }
  const data = await apiFetch("/build-by-magic/enhance-prompt", {
    method: "POST",
    body: { prompt: prompt.trim() },
  });
  if (typeof data?.enhancedPrompt !== "string" || !data.enhancedPrompt.trim()) {
    throw new Error("AI returned an invalid enhanced prompt.");
  }
  return data.enhancedPrompt;
}

export async function generateMagicForm(prompt) {
  if (typeof prompt !== "string" || !prompt.trim()) {
    throw new Error("Please describe the form you want to create.");
  }
  const data = await apiFetch("/build-by-magic/generate", {
    method: "POST",
    body: { prompt: prompt.trim() },
  });
  if (!data?.form || !Array.isArray(data.form.fields)) {
    throw new Error("AI returned an invalid form structure.");
  }
  return data.form;
}

export async function modifyMagicForm(form, instruction) {
  if (!form || !Array.isArray(form.fields)) {
    throw new Error("A valid form is required before modifying it.");
  }
  if (typeof instruction !== "string" || !instruction.trim()) {
    throw new Error("Enter an instruction for the AI.");
  }
  const data = await apiFetch("/build-by-magic/modify", {
    method: "POST",
    body: { form, instruction: instruction.trim() },
  });
  if (!data?.form || !Array.isArray(data.form.fields)) {
    throw new Error("AI returned an invalid modified form.");
  }
  return data.form;
}