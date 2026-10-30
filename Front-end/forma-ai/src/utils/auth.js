const USERS_KEY = "forma-ai-users";
const SESSION_KEY = "forma-ai-session";

export function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function registerUser(user) {
  const users = getUsers();
  const name = user.name.trim();
  const email = user.email.trim().toLowerCase();

  const emailExists = users.some(
    (item) => item.email.toLowerCase() === email
  );

  if (emailExists) {
    return {
      success: false,
      message: "This email is already registered.",
    };
  }

  users.push({
    name,
    email,
    password: user.password,
  });

  localStorage.setItem(USERS_KEY, JSON.stringify(users));

  return { success: true };
}

export function loginUser(email, password) {
  const users = getUsers();

  const user = users.find(
    (item) =>
      item.email === email.trim().toLowerCase() &&
      item.password === password
  );

  if (!user) {
    return {
      success: false,
      message: "Invalid email or password.",
    };
  }

  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({
      name: user.name,
      email: user.email,
    })
  );

  return { success: true };
}

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

export function logoutUser() {
  localStorage.removeItem(SESSION_KEY);
}