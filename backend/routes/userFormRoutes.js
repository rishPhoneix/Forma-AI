const express = require("express");
const { requireAuth } = require("../middleware/auth");

const {
  createForm,
  listMyForms,
  getMyForm,
  updateForm,
  deleteForm,
  updatePublishStatus,
} = require("../controllers/userFormController");

const router = express.Router();

router.use(requireAuth);

router.get("/", listMyForms);
router.post("/", createForm);
router.get("/:id", getMyForm);
router.put("/:id", updateForm);
router.delete("/:id", deleteForm);
router.patch("/:id/publish", updatePublishStatus);

module.exports = router;