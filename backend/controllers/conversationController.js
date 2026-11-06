const mongoose = require("mongoose");
const Conversation = require("../models/Conversation");

const MAX_MESSAGES = 100;
const MAX_CONTENT_LENGTH = 10000;

function getOwnedConversationQuery(conversationId, userId) {
  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    return null;
  }

  return {
    _id: conversationId,
    userId,
  };
}

exports.getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      userId: req.user._id,
    })
      .select("title createdAt updatedAt")
      .sort({ updatedAt: -1 })
      .lean();

    res.json({ conversations });
  } catch (err) {
    next(err);
  }
};

exports.createConversation = async (req, res, next) => {
  try {
    const title =
      typeof req.body.title === "string" && req.body.title.trim()
        ? req.body.title.trim().slice(0, 120)
        : "New conversation";

    const conversation = await Conversation.create({
      userId: req.user._id,
      title,
      messages: [],
    });

    res.status(201).json({ conversation });
  } catch (err) {
    next(err);
  }
};

exports.getConversation = async (req, res, next) => {
  try {
    const query = getOwnedConversationQuery(
      req.params.id,
      req.user._id
    );

    if (!query) {
      return res.status(400).json({
        message: "Invalid conversation ID",
      });
    }

    const conversation = await Conversation.findOne(query).lean();

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    res.json({ conversation });
  } catch (err) {
    next(err);
  }
};

exports.updateConversation = async (req, res, next) => {
  try {
    const query = getOwnedConversationQuery(
      req.params.id,
      req.user._id
    );

    if (!query) {
      return res.status(400).json({
        message: "Invalid conversation ID",
      });
    }

    const updates = {};

    if (Object.prototype.hasOwnProperty.call(req.body, "title")) {
      if (
        typeof req.body.title !== "string" ||
        !req.body.title.trim()
      ) {
        return res.status(400).json({
          message: "A valid conversation title is required",
        });
      }

      updates.title = req.body.title.trim().slice(0, 120);
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "messages")) {
      if (
        !Array.isArray(req.body.messages) ||
        req.body.messages.length > MAX_MESSAGES
      ) {
        return res.status(400).json({
          message: `Messages must be an array containing at most ${MAX_MESSAGES} items`,
        });
      }

      const validMessages = [];

      for (const message of req.body.messages) {
        if (
          !message ||
          typeof message !== "object" ||
          !["user", "assistant"].includes(message.role) ||
          typeof message.content !== "string" ||
          !message.content.trim() ||
          message.content.length > MAX_CONTENT_LENGTH
        ) {
          return res.status(400).json({
            message: "One or more messages are invalid",
          });
        }

        validMessages.push({
          role: message.role,
          content: message.content.trim(),
        });
      }

      updates.messages = validMessages;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "No valid updates provided",
      });
    }

    const conversation = await Conversation.findOneAndUpdate(
      query,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    res.json({ conversation });
  } catch (err) {
    next(err);
  }
};

exports.deleteConversation = async (req, res, next) => {
  try {
    const query = getOwnedConversationQuery(
      req.params.id,
      req.user._id
    );

    if (!query) {
      return res.status(400).json({
        message: "Invalid conversation ID",
      });
    }

    const conversation = await Conversation.findOneAndDelete(query);

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    res.json({
      message: "Conversation deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};