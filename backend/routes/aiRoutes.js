const express = require("express");
const {
  chatWithNOVA,
  generateFormWithAI,
} = require("../controllers/aiController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

router.post("/chat", chatWithNOVA);
router.post("/generate-form", generateFormWithAI);

module.exports = router;