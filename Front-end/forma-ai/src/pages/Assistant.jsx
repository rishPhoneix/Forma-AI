import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import {
  getConversations,
  createConversation,
  getConversation,
  chatWithNOVA,
  deleteConversation,
  updateConversation,
} from "../utils/conversationApi";
import "./Assistant.css";

const suggestions = [
  {
    title: "Create a form",
    description: "Build a form from your requirements",
    prompt: "Help me create a dynamic form.",
    icon: "✦",
  },
  {
    title: "Improve a form",
    description: "Make your forms clearer and better",
    prompt: "How can I improve my existing form?",
    icon: "↗",
  },
  {
    title: "Understand validation",
    description: "Learn about form fields and rules",
    prompt: "Explain form validation with examples.",
    icon: "✓",
  },
];

function formatConversation(conversation) {
  return {
    ...conversation,
    id: conversation._id,
    messages: (conversation.messages || []).map((item) => ({
      id: item._id,
      text: item.content,
      sender: item.role === "user" ? "user" : "assistant",
    })),
  };
}

function Assistant() {
  const navigate = useNavigate();
  const location = useLocation();
  const sharedConversationId = location.state?.conversationId;

  const [activeConversation, setActiveConversation] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [editingConversationId, setEditingConversationId] = useState(null);
  const [renameTitle, setRenameTitle] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const loadConversations = async () => {
    try {
      const data = await getConversations();
      setConversations(data);
    } catch (err) {
      setError(err.message || "Unable to load conversations.");
    }
  };

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await getConversations();

        if (!mounted) return;

        setConversations(data);

        if (sharedConversationId) {
          setLoadingConversation(true);
          const conversation = await getConversation(sharedConversationId);

          if (mounted) {
            setActiveConversation(formatConversation(conversation));
          }
        } else {
          setActiveConversation(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || "Unable to load conversation.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setLoadingConversation(false);
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, [sharedConversationId]);

  useEffect(() => {
    if (!deleteTarget || deleting) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setDeleteTarget(null);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [deleteTarget, deleting]);

  const startNewChat = () => {
    setActiveConversation(null);
    setMessage("");
    setError("");
    setEditingConversationId(null);
    setRenameTitle("");
    navigate("/assistant", { replace: true, state: null });
  };

  const selectConversation = async (conversation) => {
    try {
      setLoadingConversation(true);
      setError("");
      setEditingConversationId(null);

      const data = await getConversation(conversation._id);
      setActiveConversation(formatConversation(data));

      navigate("/assistant", {
        replace: true,
        state: { conversationId: conversation._id },
      });
    } catch (err) {
      setError(err.message || "Unable to open conversation.");
    } finally {
      setLoadingConversation(false);
    }
  };

  const startRenaming = (conversation) => {
    setEditingConversationId(conversation._id);
    setRenameTitle(conversation.title || "");
    setError("");
  };

  const cancelRenaming = () => {
    setEditingConversationId(null);
    setRenameTitle("");
  };

  const handleRenameConversation = async (event, conversationId) => {
    event.preventDefault();

    const title = renameTitle.trim();

    if (!title) {
      setError("Conversation title cannot be empty.");
      return;
    }

    if (title.length > 120) {
      setError("Conversation title cannot exceed 120 characters.");
      return;
    }

    try {
      setRenaming(true);
      setError("");

      const updated = await updateConversation(conversationId, { title });

      setConversations((previous) =>
        previous.map((conversation) =>
          conversation._id === conversationId
            ? { ...conversation, title: updated.title }
            : conversation
        )
      );

      setActiveConversation((previous) =>
        previous?._id === conversationId
          ? { ...previous, title: updated.title }
          : previous
      );

      cancelRenaming();
    } catch (err) {
      setError(err.message || "Unable to rename conversation.");
    } finally {
      setRenaming(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedMessage = message.trim();

    if (!trimmedMessage || sending || loadingConversation) return;

    setSending(true);
    setError("");

    try {
      let conversation = activeConversation;

      if (!conversation) {
        const title =
          trimmedMessage.length > 35
            ? `${trimmedMessage.slice(0, 35)}...`
            : trimmedMessage;

        const created = await createConversation(title);
        conversation = formatConversation(created);
      }

      const data = await chatWithNOVA(
        conversation._id,
        trimmedMessage
      );

      if (!data.conversation || !data.reply) {
        throw new Error("NOVA returned an incomplete response.");
      }

      const formatted = formatConversation(data.conversation);

      setActiveConversation(formatted);
      setMessage("");

      navigate("/assistant", {
        replace: true,
        state: { conversationId: formatted._id },
      });

      await loadConversations();
    } catch (err) {
      setError(
        err.message ||
          "NOVA could not process your message. Please try again."
      );
    } finally {
      setSending(false);
    }
  };

  const requestDeleteConversation = (conversation) => {
    setError("");
    setDeleteTarget(conversation);
  };

  const cancelDeleteConversation = () => {
    if (deleting) return;
    setDeleteTarget(null);
  };

  const confirmDeleteConversation = async () => {
    if (!deleteTarget || deleting) return;

    const conversationId = deleteTarget._id;

    try {
      setDeleting(true);
      setError("");

      await deleteConversation(conversationId);

      setConversations((previous) =>
        previous.filter(
          (conversation) => conversation._id !== conversationId
        )
      );

      if (editingConversationId === conversationId) {
        cancelRenaming();
      }

      if (activeConversation?._id === conversationId) {
        setActiveConversation(null);
        setMessage("");
        navigate("/assistant", { replace: true, state: null });
      }

      setDeleteTarget(null);
    } catch (err) {
      setError(err.message || "Unable to delete conversation.");
    } finally {
      setDeleting(false);
    }
  };

  const selectSuggestion = (prompt) => {
    setMessage(prompt);
  };

  const filteredConversations = conversations.filter((conversation) =>
    (conversation.title || "")
      .toLowerCase()
      .includes(search.trim().toLowerCase())
  );

  const closeAssistant = () => {
    navigate("/dashboard", {
      state: {
        conversationId:
          activeConversation?._id || sharedConversationId || null,
      },
    });
  };

  return (
    <div className="dashboard-layout nova-workspace">
      <Sidebar />
      <main className="dashboard-main">
        <Header />
        <div className="nova-page">
          <aside className="nova-history-panel">
            <div className="nova-history-heading">
              <div>
                <span className="nova-eyebrow">AI WORKSPACE</span>
                <h2>NOVA</h2>
              </div>
              <div className="nova-logo">✦</div>
            </div>

            <button className="nova-new-chat" onClick={startNewChat}>
              <span>＋</span>
              New conversation
            </button>

            <div className="nova-history-search">
              <span>⌕</span>
              <input
                type="text"
                placeholder="Search conversations..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <div className="nova-history-list">
              <span className="nova-section-label">
                RECENT CONVERSATIONS
              </span>

              {loading ? (
                <div className="nova-empty-history">
                  Loading conversations...
                </div>
              ) : filteredConversations.length > 0 ? (
                filteredConversations.map((conversation) => (
                  <div
                    key={conversation._id}
                    className={`nova-history-item ${
                      activeConversation?._id === conversation._id
                        ? "selected"
                        : ""
                    }`}
                  >
                    {editingConversationId === conversation._id ? (
                      <form
                        className="nova-rename-form"
                        onSubmit={(event) =>
                          handleRenameConversation(event, conversation._id)
                        }
                      >
                        <input
                          className="nova-rename-input"
                          value={renameTitle}
                          onChange={(event) =>
                            setRenameTitle(event.target.value)
                          }
                          maxLength={120}
                          autoFocus
                          aria-label="New conversation title"
                          disabled={renaming}
                        />
                        <button
                          type="submit"
                          className="nova-rename-save"
                          disabled={renaming || !renameTitle.trim()}
                          aria-label="Save conversation title"
                        >
                          {renaming ? "…" : "✓"}
                        </button>
                        <button
                          type="button"
                          className="nova-rename-cancel"
                          onClick={cancelRenaming}
                          disabled={renaming}
                          aria-label="Cancel renaming"
                        >
                          ×
                        </button>
                      </form>
                    ) : (
                      <>
                        <button
                          className="nova-history-title"
                          onClick={() => selectConversation(conversation)}
                          disabled={loadingConversation || sending}
                        >
                          <span>◷</span>
                          <span>{conversation.title}</span>
                        </button>

                        <button
                          className="nova-rename-chat"
                          onClick={() => startRenaming(conversation)}
                          aria-label="Rename conversation"
                          title="Rename conversation"
                          disabled={sending || renaming || deleting}
                        >
                          ✎
                        </button>

                        <button
                          className="nova-delete-chat"
                          onClick={() =>
                            requestDeleteConversation(conversation)
                          }
                          aria-label="Delete conversation"
                          title="Delete conversation"
                          disabled={sending || renaming || deleting}
                        >
                          ×
                        </button>
                      </>
                    )}
                  </div>
                ))
              ) : (
                <div className="nova-empty-history">
                  <span>◷</span>
                  <p>
                    {search
                      ? "No matching conversations."
                      : "Your conversations will appear here."}
                  </p>
                </div>
              )}
            </div>

            <div className="nova-history-footer">
              <span className="nova-footer-icon">✦</span>
              <div>
                <strong>Powered by NOVA</strong>
                <p>Your intelligent workspace companion</p>
              </div>
            </div>
          </aside>

          <section className="nova-chat-area">
            <div className="nova-chat-topbar">
              <div>
                <span className="nova-eyebrow">FORMA AI</span>
                <h2>
                  {activeConversation
                    ? activeConversation.title
                    : "NOVA Assistant"}
                </h2>
              </div>

              <div className="nova-topbar-actions">
                <span className="nova-status">
                  <span />
                  Workspace assistant
                </span>

                <button
                  className="nova-close-page"
                  onClick={closeAssistant}
                  aria-label="Close NOVA workspace"
                  title="Close NOVA"
                >
                  ×
                </button>
              </div>
            </div>

            {error && (
              <div className="nova-error-message" role="alert">
                {error}
              </div>
            )}

            <div className="nova-chat-content">
              {loadingConversation ? (
                <div className="nova-loading-state">
                  Loading conversation...
                </div>
              ) : activeConversation ? (
                <div className="nova-message-list">
                  {activeConversation.messages.map((item, index) => (
                    <div
                      key={item.id || `${item.sender}-${index}`}
                      className={`nova-message ${item.sender}`}
                    >
                      <div className="nova-message-avatar">
                        {item.sender === "user" ? "U" : "N"}
                      </div>

                      <div className="nova-message-bubble">
                        <span>
                          {item.sender === "user" ? "You" : "NOVA"}
                        </span>

                        {item.sender === "assistant" ? (
                          <div className="nova-markdown">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {item.text}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <p>{item.text}</p>
                        )}
                      </div>
                    </div>
                  ))}

                  {sending && (
                    <div className="nova-loading-state" aria-live="polite">
                      NOVA is thinking...
                    </div>
                  )}
                </div>
              ) : (
                <div className="nova-welcome">
                  <div className="nova-welcome-icon">✦</div>
                  <span className="nova-eyebrow">
                    YOUR AI WORKSPACE COMPANION
                  </span>
                  <h1>
                    Hello, welcome to <span>NOVA.</span>
                  </h1>
                  <p>
                    Your space to think, create, and build smarter forms.
                    Ask questions, explore ideas, and make the most of
                    your Forma AI workspace.
                  </p>

                  <div className="nova-suggestion-grid">
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion.title}
                        className="nova-suggestion-card"
                        onClick={() => selectSuggestion(suggestion.prompt)}
                      >
                        <span className="nova-suggestion-icon">
                          {suggestion.icon}
                        </span>
                        <strong>{suggestion.title}</strong>
                        <p>{suggestion.description}</p>
                        <span className="nova-suggestion-arrow">↗</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <form className="nova-message-form" onSubmit={handleSubmit}>
              <input
                type="text"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Message NOVA..."
                aria-label="Message NOVA"
                disabled={sending || loadingConversation}
              />

              <button
                type="submit"
                disabled={
                  !message.trim() || sending || loadingConversation
                }
                aria-label="Send message"
              >
                {sending ? "…" : "↑"}
              </button>

              <p>
                NOVA can make mistakes. Review important information.
              </p>
            </form>
          </section>

          {deleteTarget && (
            <div
              className="nova-delete-overlay"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                  cancelDeleteConversation();
                }
              }}
            >
              <section
                className="nova-delete-modal"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="nova-delete-title"
                aria-describedby="nova-delete-description"
              >
                <div className="nova-delete-icon">!</div>

                <h2 id="nova-delete-title">
                  Delete conversation?
                </h2>

                <p id="nova-delete-description">
                  Are you sure you want to delete{" "}
                  <strong>{deleteTarget.title}</strong>? This conversation
                  and its messages will be permanently deleted.
                </p>

                <div className="nova-delete-actions">
                  <button
                    type="button"
                    className="nova-delete-cancel"
                    onClick={cancelDeleteConversation}
                    disabled={deleting}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="nova-delete-confirm"
                    onClick={confirmDeleteConversation}
                    disabled={deleting}
                  >
                    {deleting ? "Deleting..." : "Delete conversation"}
                  </button>
                </div>
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Assistant;