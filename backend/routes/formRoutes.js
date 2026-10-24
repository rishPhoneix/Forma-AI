const express = require("express");
const { listForms, getForm, createForm } = require("../controllers/formController");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.get("/", listForms);
router.get("/:formId", getForm);
router.post("/", requireAuth, requireAdmin, createForm);

module.exports = router;