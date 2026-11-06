import { apiFetch } from "./api";

export async function getConversations() {
  const data = await apiFetch("/conversations");
  return data.conversations;
}

export async function createConversation(title = "New conversation") {
  const data = await apiFetch("/conversations", {
    method: "POST",
    body: { title },
  });

  return data.conversation;
}

export async function getConversation(id) {
  const data = await apiFetch(
    `/conversations/${encodeURIComponent(id)}`
  );

  return data.conversation;
}

export async function updateConversation(id, updates) {
  const data = await apiFetch(
    `/conversations/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: updates,
    }
  );

  return data.conversation;
}

export async function deleteConversation(id) {
  return apiFetch(
    `/conversations/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
    }
  );
}

export async function chatWithNOVA(conversationId, message) {
  const data = await apiFetch("/ai/chat", {
    method: "POST",
    body: {
      conversationId,
      message,
    },
  });

  return data;
}