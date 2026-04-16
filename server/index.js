import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import {
  getConversations,
  getConversation,
  getActions,
  addMessage,
  addConversation,
} from "./mockData.js";
import { generateDraft } from "./openai.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ─── GET /api/conversations ─────────────────────────────────────────────────
// Returns all conversations without full message history (for the list view).
app.get("/api/conversations", (req, res) => {
  try {
    const conversations = getConversations();
    res.json(conversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

// ─── GET /api/conversations/:id ─────────────────────────────────────────────
// Returns a single conversation with full message history.
app.get("/api/conversations/:id", (req, res) => {
  try {
    const conversation = getConversation(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    res.json(conversation);
  } catch (error) {
    console.error("Error fetching conversation:", error);
    res.status(500).json({ error: "Failed to fetch conversation" });
  }
});

// ─── GET /api/actions ───────────────────────────────────────────────────────
// Returns AI action cards for conversations that need attention.
app.get("/api/actions", (req, res) => {
  try {
    const actions = getActions();
    res.json(actions);
  } catch (error) {
    console.error("Error fetching actions:", error);
    res.status(500).json({ error: "Failed to fetch actions" });
  }
});

// ─── POST /api/ai/draft ────────────────────────────────────────────────────
// Generates an AI draft message for a given conversation and action type.
// Body: { conversationId: string, actionType: string }
app.post("/api/ai/draft", async (req, res) => {
  try {
    const { conversationId, actionType } = req.body;

    if (!conversationId || !actionType) {
      return res
        .status(400)
        .json({ error: "conversationId and actionType are required" });
    }

    const conversation = getConversation(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const draft = await generateDraft(conversation, actionType);
    res.json(draft);
  } catch (error) {
    console.error("Error generating draft:", error);
    res.status(500).json({ error: "Failed to generate AI draft" });
  }
});

// ─── POST /api/conversations ────────────────────────────────────────────────
// Creates a new conversation with a customer name.
// Body: { name: string }
app.post("/api/conversations", (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Customer name is required" });
    }
    const conversation = addConversation(name.trim());
    res.json(conversation);
  } catch (error) {
    console.error("Error creating conversation:", error);
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

// ─── POST /api/messages/:conversationId ─────────────────────────────────────
// Sends a message from the Pro to a conversation.
// Body: { text: string }
app.post("/api/messages/:conversationId", (req, res) => {
  try {
    const { text, sender } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Message text is required" });
    }

    const message = addMessage(req.params.conversationId, text.trim(), sender || "pro");
    if (!message) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    res.json(message);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// ─── Start server ───────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
