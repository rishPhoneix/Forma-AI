import { apiFetch } from "./api";

export function fetchForms() {
  return apiFetch("/forms", { auth: false });
}

export function fetchForm(formId) {
  return apiFetch(`/forms/${encodeURIComponent(formId)}`, { auth: false });
}