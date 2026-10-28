const express = require("express");
const { rateLimit } = require("express-rate-limit");
const { requireAuth } = require("../middleware/auth");
const { extractValues } = require("../controllers/extractController");

const router = express.Router();

const extractLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => String(req.user._id),
  message: { message: "Too many requests. Please wait a minute and try again." },
});

router.post("/", requireAuth, extractLimiter, extractValues);

module.exports = router;