const { z } = require("zod");

const signupZ = z.object({
  name: z.string().trim().min(1, "name is required").max(100, "name is too long"),
  email: z.string().trim().toLowerCase().pipe(z.email("must be a valid email")),
  password: z
    .string()
    .min(8, "must be at least 8 characters")
    .max(72, "must be at most 72 characters"),
});

const loginZ = z.object({
  email: z.string().trim().toLowerCase().min(1, "email is required"),
  password: z.string().min(1, "password is required"),
});

function run(schema, body) {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
    };
  }
  return { ok: true, data: parsed.data };
}

module.exports = {
  validateSignup: (body) => run(signupZ, body),
  validateLogin: (body) => run(loginZ, body),
};