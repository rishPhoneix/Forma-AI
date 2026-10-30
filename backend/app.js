const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const helmet = require("helmet");
const authRoutes = require("./routes/authRoutes");
const formRoutes = require("./routes/formRoutes");
const extractRoutes = require("./routes/extractRoutes");

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "20kb" }));

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Forma AI API is running",
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/forms", formRoutes);
app.use("/api/extract", extractRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Request body is not valid JSON" });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ message: "Request body is too large" });
  }
  console.error(err);
  res.status(500).json({ message: "Something went wrong on the server" });
});

module.exports = app;