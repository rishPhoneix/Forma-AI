require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET) {
  console.error("Startup failed: JWT_SECRET is not set in .env");
  process.exit(1);
}

connectDB()
  .then(() => {
    app.listen(PORT, () =>
      console.log(`Forma AI API running at http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error("Startup failed:", err.message);
    process.exit(1);
  });