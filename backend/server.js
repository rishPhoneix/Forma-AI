const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Forma AI API is running",
  });
});

app.listen(PORT, () => {
  console.log(`Forma AI API running at http://localhost:${PORT}`);
});
