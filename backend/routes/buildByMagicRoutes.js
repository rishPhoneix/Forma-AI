const express = require("express");

const {
  enhancePrompt,
  generateFormWithAI,
  modifyForm,
} = require("../controllers/buildByMagicController");

const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

router.post("/enhance-prompt", enhancePrompt);
router.post("/generate", generateFormWithAI);
router.post("/modify", modifyForm);

module.exports = router;