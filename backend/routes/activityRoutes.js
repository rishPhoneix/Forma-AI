const express = require("express");
const { requireAuth } = require("../middleware/auth");
const {
  createActivity,
  listMyActivities,
} = require("../controllers/activityController");

const router = express.Router();

router.use(requireAuth);

router.get("/", listMyActivities);
router.post("/", createActivity);

module.exports = router;