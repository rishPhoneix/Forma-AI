import { apiFetch } from "./api";

export async function fetchUserForms() {
  return apiFetch("/user-forms");
}

export async function fetchUserForm(formId) {
  const data = await apiFetch(`/user-forms/${encodeURIComponent(formId)}`);
  return data?.form || data;
}

export async function createUserForm(formData) {
  const data = await apiFetch("/user-forms", {
    method: "POST",
    body: formData,
  });

  return data.form;
}

export async function updateUserForm(formId, updates) {
  const data = await apiFetch(
    `/user-forms/${encodeURIComponent(formId)}`,
    {
      method: "PUT",
      body: updates,
    }
  );

  return data.form;
}

export async function deleteUserForm(formId) {
  return apiFetch(
    `/user-forms/${encodeURIComponent(formId)}`,
    {
      method: "DELETE",
    }
  );
}

export async function publishUserForm(formId, published) {
  const data = await apiFetch(
    `/user-forms/${encodeURIComponent(formId)}/publish`,
    {
      method: "PATCH",
      body: { published },
    }
  );

  return data.form;
}

export async function fetchUserFormVersions(formId) {
  return apiFetch(
    `/user-forms/${encodeURIComponent(formId)}/versions`
  );
}

export async function restoreUserFormVersion(formId, version) {
  const data = await apiFetch(
    `/user-forms/${encodeURIComponent(formId)}/restore/${encodeURIComponent(version)}`,
    {
      method: "POST",
    }
  );

  return data.form;
}

export async function fetchMySubmissions() {
  return apiFetch("/submissions");
}

export async function fetchMySubmission(submissionId) {
  return apiFetch(`/submissions/${encodeURIComponent(submissionId)}`);
}