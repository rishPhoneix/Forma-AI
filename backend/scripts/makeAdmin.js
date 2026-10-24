const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const User = require("../models/User");

async function makeAdmin() {
  const email = (process.argv[2] || "").trim().toLowerCase();
  if (!email) throw new Error("Usage: node scripts/makeAdmin.js your@email.com");
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is not set in .env");

  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOneAndUpdate({ email }, { role: "admin" }, { returnDocument: "after" });
  if (!user) throw new Error(`No user found with email ${email}. Sign up first.`);
  console.log(`${user.email} is now an admin`);
  await mongoose.disconnect();
}

makeAdmin().catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});