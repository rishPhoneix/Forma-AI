const express = require("express");
const { chatWithNOVA } = require("../controllers/aiController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

router.post("/chat", chatWithNOVA);

module.exports = router;