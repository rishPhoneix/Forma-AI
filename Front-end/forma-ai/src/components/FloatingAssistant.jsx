import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  createConversation,
  getConversation,
  chatWithNOVA,
} from "../utils/conversationApi";
import "./FloatingAssistant.css";

const suggestions = [
  "Help me create a form",
  "How can I improve my form?",
  "Explain form validation",
];

function FloatingAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [error, setError] = useState("");

  const chatEndRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const sharedConversationId = location.state?.conversationId;

  useEffect(() => {
    let mounted = true;

    const loadSharedConversation = async () => {
      if (!sharedConversationId) return;

      setLoadingConversation(true);
      setError("");

      try {
        const conversation = await getConversation(sharedConversationId);

        if (!mounted) return;

        setConversationId(conversation._id);
        setMessages(
          (conversation.messages || []).map((item) => ({
            id: item._id,
            role: item.role,
            content: item.content,
          }))
        );
        setIsOpen(true);
      } catch (err) {
        if (mounted) {
          setError(err.message || "Unable to load conversation.");
        }
      } finally {
        if (mounted) {
          setLoadingConversation(false);
        }
      }
    };

    loadSharedConversation();

    return () => {
      mounted = false;
    };
  }, [sharedConversationId]);

  useEffect(() => {
    if (!isOpen || loadingConversation) return;

    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, sending, isOpen, loadingConversation, error]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedMessage = message.trim();

    if (!trimmedMessage || sending || loadingConversation) return;

    setSending(true);
    setError("");

    try {
      let activeId = conversationId;

      if (!activeId) {
        const title =
          trimmedMessage.length > 35
            ? `${trimmedMessage.slice(0, 35)}...`
            : trimmedMessage;

        const conversation = await createConversation(title);
        activeId = conversation._id;
        setConversationId(activeId);
      }

      const data = await chatWithNOVA(activeId, trimmedMessage);

      if (!data.conversation || !data.reply) {
        throw new Error("NOVA returned an incomplete response.");
      }

      setMessages(
        (data.conversation.messages || []).map((item) => ({
          id: item._id,
          role: item.role,
          content: item.content,
        }))
      );

      setMessage("");
    } catch (err) {
      setError(
        err.message || "NOVA could not process your message. Please try again."
      );
    } finally {
      setSending(false);
    }
  };

  const openWorkspace = () => {
    setIsOpen(false);
    navigate("/assistant", {
      state: { conversationId },
    });
  };

  if (location.pathname === "/assistant") {
    return null;
  }

  return (
    <div className="assistant-widget">
      {isOpen && (
        <section className="assistant-panel" aria-label="NOVA AI Assistant">
          <div className="assistant-panel-header">
            <div className="assistant-heading">
              <div className="assistant-avatar">N</div>
              <div>
                <h3>NOVA</h3>
                <span>Your AI workspace assistant</span>
              </div>
            </div>

            <button
              className="assistant-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close NOVA"
            >
              ×
            </button>
          </div>

          <div className="assistant-chat">
            {loadingConversation ? (
              <div className="assistant-loading">
                Loading conversation...
              </div>
            ) : messages.length === 0 ? (
              <>
                <div className="assistant-welcome">
                  <div className="assistant-welcome-icon">✦</div>
                  <h3>Hi! I'm NOVA.</h3>
                  <p>
                    Your intelligent workspace companion. I can help you
                    create forms, understand validation, improve your
                    workflows, and get more out of Forma AI.
                  </p>
                </div>

                <div className="assistant-suggestions">
                  <span>TRY ASKING</span>
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setMessage(suggestion)}
                    >
                      {suggestion}
                      <span>↗</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="assistant-saved-messages">
                {messages.map((item, index) => (
                  <div
                    key={item.id || `${item.role}-${index}`}
                    className={`assistant-saved-message ${item.role}`}
                  >
                    <strong>
                      {item.role === "user" ? "You" : "NOVA"}
                    </strong>

                    {item.role === "assistant" ? (
                      <div className="assistant-markdown">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {item.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p>{item.content}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {sending && (
              <div className="assistant-loading" aria-live="polite">
                NOVA is thinking...
              </div>
            )}

            {error && (
              <p className="assistant-error" role="alert">
                {error}
              </p>
            )}

            <div ref={chatEndRef} />
          </div>

          <form className="assistant-input-area" onSubmit={handleSubmit}>
            <input
              type="text"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Ask NOVA anything..."
              aria-label="Message NOVA"
              disabled={sending || loadingConversation}
            />

            <button
              type="submit"
              disabled={
                !message.trim() || sending || loadingConversation
              }
              aria-label="Send message to NOVA"
            >
              {sending ? "…" : "↑"}
            </button>
          </form>

          <div className="assistant-panel-footer">
            <button onClick={openWorkspace}>
              Open NOVA workspace
              <span>↗</span>
            </button>
          </div>
        </section>
      )}

      <button
        className={`assistant-launcher ${isOpen ? "active" : ""}`}
        onClick={() => setIsOpen((previous) => !previous)}
        aria-label={isOpen ? "Close NOVA" : "Open NOVA"}
        aria-expanded={isOpen}
      >
        {isOpen ? "×" : "✦"}
      </button>
    </div>
  );
}

export default FloatingAssistant;