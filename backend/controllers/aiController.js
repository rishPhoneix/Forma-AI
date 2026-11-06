const mongoose = require("mongoose");
const { GoogleGenAI } = require("@google/genai");
const Conversation = require("../models/Conversation");

const client = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

const chatWithNOVA = async (req, res) => {
  try {
    const { conversationId, message } = req.body;

    if (!mongoose.isValidObjectId(conversationId)) {
      return res.status(400).json({
        message: "Invalid conversation ID",
      });
    }

    if (
      typeof message !== "string" ||
      !message.trim() ||
      message.trim().length > 5000
    ) {
      return res.status(400).json({
        message: "Message must contain between 1 and 5000 characters",
      });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    const userMessage = message.trim();

    const history = conversation.messages.slice(-20).map((item) => ({
      role: item.role === "assistant" ? "model" : "user",
      parts: [{ text: item.content }],
    }));

    history.push({
      role: "user",
      parts: [{ text: userMessage }],
    });

    const response = await client.models.generateContent({
      model: process.env.LLM_MODEL || "gemini-3.5-flash-lite",
      contents: history,
      config: {
        systemInstruction:
          "You are NOVA, the intelligent AI assistant inside Forma AI. Help users create forms, understand data, solve problems, and improve their workflows. Be accurate, clear, professional, and friendly. Use concise explanations and structured formatting when helpful.",
      },
    });

    const assistantReply = response.text?.trim();

    if (!assistantReply) {
      throw new Error("Gemini returned an empty response");
    }

    conversation.messages.push(
      {
        role: "user",
        content: userMessage,
      },
      {
        role: "assistant",
        content: assistantReply,
      }
    );

    if (
      conversation.title === "New conversation" &&
      conversation.messages.length === 2
    ) {
      conversation.title = userMessage.slice(0, 60);
    }

    await conversation.save();

    return res.status(200).json({
      conversation,
      reply: assistantReply,
    });
  } catch (error) {
    console.error("NOVA Gemini Error:", {
      status: error.status,
      message: error.message,
    });

    return res.status(502).json({
      message: "NOVA is temporarily unavailable. Please try again.",
    });
  }
};

module.exports = { chatWithNOVA };