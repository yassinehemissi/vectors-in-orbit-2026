"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AGENT_MODELS, DEFAULT_AGENT_MODEL } from "@/lib/agent-models";

interface AgentMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface AgentConversation {
  id: string;
  sessionId: string;
  title: string;
  summary?: string;
  lastMessageAt?: string;
}

const SESSION_STORAGE_KEY = "experimentein_agent_session";
const CONVERSATION_STORAGE_KEY = "experimentein_agent_conversation";
const AUTOSTART_STORAGE_KEY = "experimentein_agent_autostart";
const MODEL_STORAGE_KEY = "experimentein_agent_model";

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderInlineMarkdown(input: string) {
  let output = escapeHtml(input);
  output = output.replace(/`([^`]+)`/g, "<code>$1</code>");
  output = output.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  output = output.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  output = output.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="text-emerald-300 underline" target="_self" rel="noreferrer">$1</a>'
  );
  return output;
}

function markdownToHtml(input: string) {
  const lines = input.split(/\r?\n/);
  let html = "";
  let inList = false;

  for (const line of lines) {
    if (!line.trim()) {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      html += '<div class="h-2"></div>';
      continue;
    }

    if (line.startsWith("### ")) {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      html += `<h3 class="text-sm font-semibold">${renderInlineMarkdown(line.slice(4))}</h3>`;
      continue;
    }

    if (line.startsWith("## ")) {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      html += `<h2 class="text-base font-semibold">${renderInlineMarkdown(line.slice(3))}</h2>`;
      continue;
    }

    if (line.startsWith("# ")) {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      html += `<h1 class="text-lg font-semibold">${renderInlineMarkdown(line.slice(2))}</h1>`;
      continue;
    }

    if (line.startsWith("- ")) {
      if (!inList) {
        html += '<ul class="ml-4 list-disc space-y-1">';
        inList = true;
      }
      html += `<li>${renderInlineMarkdown(line.slice(2))}</li>`;
      continue;
    }

    if (inList) {
      html += "</ul>";
      inList = false;
    }

    html += `<p>${renderInlineMarkdown(line)}</p>`;
  }

  if (inList) {
    html += "</ul>";
  }

  return html;
}

export function DashboardAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [model, setModel] = useState(DEFAULT_AGENT_MODEL);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [conversations, setConversations] = useState<AgentConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    null
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  async function fetchConversations() {
    try {
      const response = await fetch("/api/agent/conversations");
      if (!response.ok) return;
      const data = (await response.json()) as {
        conversations?: AgentConversation[];
      };
      setConversations(data.conversations ?? []);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    const storedSession = window.localStorage.getItem(SESSION_STORAGE_KEY);
    const storedConversation = window.localStorage.getItem(
      CONVERSATION_STORAGE_KEY
    );
    const autoStart = window.localStorage.getItem(AUTOSTART_STORAGE_KEY);
    const storedModel = window.localStorage.getItem(MODEL_STORAGE_KEY);
    if (storedSession) {
      setSessionId(storedSession);
    }
    if (storedConversation) {
      setActiveConversationId(storedConversation);
      setIsOpen(true);
      void handleLoadConversation({
        id: storedConversation,
        sessionId: storedSession ?? "",
        title: "Conversation",
      });
    }
    if (storedModel && AGENT_MODELS.includes(storedModel)) {
      setModel(storedModel);
    }
    if (autoStart === "1") {
      setIsOpen(true);
      window.localStorage.removeItem(AUTOSTART_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    void fetchConversations();
  }, [isOpen]);

  const hint = useMemo(
    () =>
      messages.length
        ? "Ask for experiments, sections, or summaries."
        : "Ask anything about papers, experiments, or how to navigate the platform.",
    [messages.length]
  );

  const handleLoadConversation = async (conversation: AgentConversation) => {
    setIsHistoryOpen(false);
    setActiveConversationId(conversation.id);
    if (conversation.sessionId) {
      setSessionId(conversation.sessionId);
      window.localStorage.setItem(SESSION_STORAGE_KEY, conversation.sessionId);
    }
    window.localStorage.setItem(CONVERSATION_STORAGE_KEY, conversation.id);

    try {
      const response = await fetch(
        `/api/agent/conversations/${conversation.id}`
      );
      if (!response.ok) return;
      const data = (await response.json()) as {
        conversation?: AgentConversation;
        messages?: AgentMessage[];
      };
      if (data.conversation?.sessionId) {
        setSessionId(data.conversation.sessionId);
        window.localStorage.setItem(
          SESSION_STORAGE_KEY,
          data.conversation.sessionId
        );
      }
      setMessages(data.messages ?? []);
    } catch {
      // ignore
    }
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const newMessage: AgentMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          sessionId,
          model,
        }),
      });

      const data = (await response.json()) as {
        reply?: string;
        sessionId?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Agent failed to respond.");
      }

      if (data.sessionId) {
        setSessionId(data.sessionId);
        window.localStorage.setItem(SESSION_STORAGE_KEY, data.sessionId);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.reply ?? "",
        },
      ]);

      void fetchConversations();
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            error instanceof Error
              ? `Sorry, I hit an error: ${error.message}`
              : "Sorry, I hit an unexpected error.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([]);
    setSessionId(null);
    setActiveConversationId(null);
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    window.localStorage.removeItem(CONVERSATION_STORAGE_KEY);
  };

  const handleModelChange = (value: string) => {
    setModel(value);
    window.localStorage.setItem(MODEL_STORAGE_KEY, value);
  };

  return (
    <div className="fixed inset-0 z-[70] pointer-events-none">
      {isOpen ? (
        <div className="pointer-events-auto fixed right-0 top-0 flex h-full w-full max-w-[420px] flex-col overflow-hidden border-l border-neutral-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">
                Experimentein
              </p>
              <p className="text-sm font-semibold">Agent</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn-secondary text-xs"
                onClick={() => setIsHistoryOpen((prev) => !prev)}
              >
                History
              </button>
              <a
                className="btn-secondary text-xs"
                href="/dashboard/agent"
              >
                Manage
              </a>
              <button
                type="button"
                className="btn-secondary text-xs"
                onClick={() => setIsOpen(false)}
              >
                Close
              </button>
            </div>
          </div>

          <div className="border-b border-neutral-200 px-4 py-3">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
              Model
            </label>
            <div className="mt-2 flex items-center gap-2">
              <select
                className="flex-1 rounded-full border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold"
                value={model}
                onChange={(event) => handleModelChange(event.target.value)}
              >
                {AGENT_MODELS.map((modelOption) => (
                  <option key={modelOption} value={modelOption}>
                    {modelOption}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn-secondary text-xs"
                onClick={handleReset}
              >
                New
              </button>
            </div>
          </div>

          {isHistoryOpen ? (
            <div className="border-b border-neutral-200 bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
                Recent
              </p>
              <div className="mt-3 max-h-40 space-y-2 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-500">
                    No saved conversations yet.
                  </div>
                ) : (
                  conversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      type="button"
                      className={`w-full rounded-2xl border px-3 py-2 text-left text-xs ${
                        activeConversationId === conversation.id
                          ? "border-neutral-900 bg-neutral-100"
                          : "border-neutral-200 bg-white"
                      }`}
                      onClick={() => void handleLoadConversation(conversation)}
                    >
                      <p className="font-semibold">{conversation.title}</p>
                      {conversation.summary ? (
                        <p className="mt-1 line-clamp-2 text-neutral-500">
                          {conversation.summary}
                        </p>
                      ) : null}
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : null}

          <div
            ref={scrollRef}
            className="flex-1 space-y-4 overflow-y-auto bg-neutral-50 px-4 py-4 text-sm text-neutral-900"
          >
            {messages.length === 0 ? (
              <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-xs text-neutral-500">
                {hint}
              </div>
            ) : null}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  message.role === "user"
                    ? "ml-8 border border-neutral-200 bg-white"
                    : "mr-8 border border-neutral-200 bg-neutral-100"
                }`}
              >
                {message.role === "assistant" ? (
                  <div
                    className="space-y-2 text-neutral-800"
                    dangerouslySetInnerHTML={{
                      __html: markdownToHtml(message.content),
                    }}
                  />
                ) : (
                  <p className="whitespace-pre-wrap text-neutral-800">
                    {message.content}
                  </p>
                )}
              </div>
            ))}

            {isLoading ? (
              <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-xs text-neutral-500">
                Thinking...
              </div>
            ) : null}
          </div>

          <div className="border-t border-neutral-200 bg-white px-4 py-3">
            <div className="flex items-center gap-2">
              <input
                className="flex-1 rounded-full border border-neutral-200 px-4 py-2 text-sm"
                placeholder={hint}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void handleSend();
                  }
                }}
              />
              <button
                type="button"
                className="btn-primary"
                onClick={() => void handleSend()}
                disabled={isLoading}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      ) : (
          <button
            type="button"
            className="pointer-events-auto fixed bottom-6 right-6 rounded-full bg-neutral-900 px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-lg"
            onClick={() => setIsOpen(true)}
          >
            Agent
          </button>
      )}
    </div>
  );
}
