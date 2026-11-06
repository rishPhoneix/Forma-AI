const express = require("express");
const { requireAuth } = require("../middleware/auth");
const {
  listMySubmissions,
  getMySubmission,
} = require("../controllers/submissionController");

const router = express.Router();

router.use(requireAuth);

router.get("/", listMySubmissions);
router.get("/:id", getMySubmission);

module.exports = router;