const jwt = require("jsonwebtoken");

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set in .env");
  return secret;
}

function signToken(user) {
  return jwt.sign({ sub: String(user._id), role: user.role }, getSecret(), {
    expiresIn: "7d",
  });
}

function verifyToken(token) {
  return jwt.verify(token, getSecret(), { algorithms: ["HS256"] });
}

module.exports = { signToken, verifyToken };