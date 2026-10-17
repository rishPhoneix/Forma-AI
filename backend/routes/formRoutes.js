const express = require("express");
const { listForms, getForm, createForm } = require("../controllers/formController");

const router = express.Router();

router.get("/", listForms);
router.get("/:formId", getForm);
router.post("/", createForm);

module.exports = router;