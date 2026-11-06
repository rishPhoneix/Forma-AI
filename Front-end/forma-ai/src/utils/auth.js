import {
  apiFetch,
  ApiError,
  getStoredAuth,
  setStoredAuth,
  clearStoredAuth,
} from "./api";

export function getSession() {
  const stored = getStoredAuth();
  if (!stored?.token || !stored?.user) return null;
  return { ...stored.user, token: stored.token };
}

function toFailure(err) {
  if (!(err instanceof ApiError)) {
    return { success: false, message: "Something went wrong. Please try again." };
  }
  const first =
    Array.isArray(err.details) && typeof err.details[0] === "string"
      ? err.details[0]
      : null;
  return {
    success: false,
    message: first ? `${err.message}: ${first}` : err.message,
  };
}

export async function registerUser({ name, email, password }) {
  try {
    await apiFetch("/auth/signup", {
      method: "POST",
      auth: false,
      body: { name, email, password },
    });
    return { success: true };
  } catch (err) {
    return toFailure(err);
  }
}

export async function loginUser(email, password) {
  try {
    const data = await apiFetch("/auth/login", {
      method: "POST",
      auth: false,
      body: { email, password },
    });
    setStoredAuth({ token: data.token, user: data.user });
    return { success: true };
  } catch (err) {
    return toFailure(err);
  }
}

export function logoutUser() {
  clearStoredAuth();
}