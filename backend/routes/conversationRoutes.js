const express = require("express");

const {
  getConversations,
  createConversation,
  getConversation,
  updateConversation,
  deleteConversation,
} = require("../controllers/conversationController");

const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

router.get("/", getConversations);
router.post("/", createConversation);
router.get("/:id", getConversation);
router.patch("/:id", updateConversation);
router.delete("/:id", deleteConversation);

module.exports = router;