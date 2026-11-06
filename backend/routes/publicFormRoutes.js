const express = require("express");
const {
  getPublishedForm,
} = require("../controllers/publicFormController");
const {
  createSubmission,
} = require("../controllers/submissionController");

const router = express.Router();

router.get("/forms/:id", getPublishedForm);
router.post("/forms/:id/submissions", createSubmission);

module.exports = router;