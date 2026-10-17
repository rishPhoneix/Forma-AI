const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const formRoutes = require("./routes/formRoutes");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Forma AI API is running",
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

app.use("/api/forms", formRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Request body is not valid JSON" });
  }
  console.error(err);
  res.status(500).json({ message: "Something went wrong on the server" });
});

module.exports = app;