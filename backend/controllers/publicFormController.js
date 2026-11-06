const mongoose = require("mongoose");
const UserForm = require("../models/UserForm");

exports.getPublishedForm = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: "Form not found" });
    }

    const form = await UserForm.findOne({
      _id: id,
      status: "published",
    })
      .select("_id title description fields version publishedAt")
      .lean();

    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }

    res.json({ form });
  } catch (err) {
    next(err);
  }
};