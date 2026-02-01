"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { AGENT_MODELS, DEFAULT_AGENT_MODEL } from "@/lib/agent-models";
import {
  OpenAI,
  Anthropic,
  Google,
  Meta,
  Mistral,
  DeepSeek,
} from "@lobehub/icons";

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

const markdownComponents = {
  h1: (props: any) => <h1 className="text-lg font-semibold" {...props} />,
  h2: (props: any) => <h2 className="text-base font-semibold" {...props} />,
  h3: (props: any) => <h3 className="text-sm font-semibold" {...props} />,
  p: (props: any) => <p className="text-sm leading-relaxed" {...props} />,
  ul: (props: any) => <ul className="ml-4 list-disc space-y-1" {...props} />,
  ol: (props: any) => <ol className="ml-4 list-decimal space-y-1" {...props} />,
  li: (props: any) => <li className="text-sm leading-relaxed" {...props} />,
  a: (props: any) => (
    <a className="text-emerald-300 underline" target="_self" rel="noreferrer" {...props} />
  ),
  code: (props: any) => (
    <code className="rounded bg-neutral-200 px-1 py-0.5 text-xs" {...props} />
  ),
  pre: (props: any) => (
    <pre className="overflow-x-auto rounded bg-neutral-900 p-3 text-xs text-neutral-100" {...props} />
  ),
  blockquote: (props: any) => (
    <blockquote className="border-l-2 border-neutral-300 pl-3 text-sm italic" {...props} />
  ),
};

const markdownSanitizeSchema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "pre",
    "code",
  ],
  attributes: {
    ...defaultSchema.attributes,
    a: ["href", "title", "target", "rel"],
    code: ["className"],
    pre: ["className"],
  },
};

const PROVIDER_ORDER = [
  "openai",
  "anthropic",
  "google",
  "meta-llama",
  "mistralai",
  "deepseek",
] as const;

const PROVIDER_META: Record<
  string,
  { label: string; Icon: ComponentType<{ className?: string }> }
> = {
  openai: { label: "OpenAI", Icon: OpenAI },
  anthropic: { label: "Anthropic", Icon: Anthropic },
  google: { label: "Google", Icon: Google },
  "meta-llama": { label: "Meta", Icon: Meta },
  mistralai: { label: "Mistral", Icon: Mistral },
  deepseek: { label: "DeepSeek", Icon: DeepSeek },
};

const formatModelLabel = (modelId: string) => {
  const [, raw] = modelId.split("/");
  if (!raw) return modelId;
  return raw
    .split("-")
    .map((part) => {
      if (/^\d+(\.\d+)?$/.test(part)) return part;
      if (part.length <= 2) return part.toUpperCase();
      return part[0].toUpperCase() + part.slice(1);
    })
    .join(" ");
};

export function DashboardAgent() {
  const agentDisabled = true;
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [model, setModel] = useState(DEFAULT_AGENT_MODEL);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isModelOpen, setIsModelOpen] = useState(false);
  const [conversations, setConversations] = useState<AgentConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    null
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!isModelOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (
        modelMenuRef.current &&
        !modelMenuRef.current.contains(event.target as Node)
      ) {
        setIsModelOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isModelOpen]);

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
    if (agentDisabled) return;
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
    setIsModelOpen(false);
  };

  const modelGroups = useMemo(() => {
    const grouped: Record<string, string[]> = {};
    AGENT_MODELS.forEach((modelId) => {
      const provider = modelId.split("/")[0] ?? "other";
      if (!grouped[provider]) grouped[provider] = [];
      grouped[provider].push(modelId);
    });
    return grouped;
  }, []);

  const orderedProviders = useMemo(() => {
    const extras = Object.keys(modelGroups).filter(
      (provider) => !PROVIDER_ORDER.includes(provider as any)
    );
    return [...PROVIDER_ORDER, ...extras];
  }, [modelGroups]);

  const activeProvider = model.split("/")[0] ?? "openai";
  const activeProviderMeta = PROVIDER_META[activeProvider];
  const ActiveIcon = activeProviderMeta?.Icon;
  const activeLabel = activeProviderMeta?.label ?? "Model";
  const activeModelLabel = formatModelLabel(model);

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
              <div className="relative flex-1" ref={modelMenuRef}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-full border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold"
                  onClick={() => setIsModelOpen((prev) => !prev)}
                  aria-expanded={isModelOpen}
                  aria-haspopup="listbox"
                >
                  <span className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 text-[10px]">
                      {ActiveIcon ? (
                        <ActiveIcon className="h-4 w-4 text-neutral-700" />
                      ) : (
                        activeLabel.slice(0, 2).toUpperCase()
                      )}
                    </span>
                    <span className="flex flex-col text-left">
                      <span className="text-[11px] text-neutral-500">
                        {activeLabel}
                      </span>
                      <span>{activeModelLabel}</span>
                    </span>
                  </span>
                  <span className="text-neutral-400">▾</span>
                </button>

                {isModelOpen ? (
                  <div className="absolute left-0 top-full z-20 mt-2 w-full rounded-2xl border border-neutral-200 bg-white p-2 shadow-xl">
                    <div className="max-h-64 space-y-2 overflow-y-auto px-1 py-1 text-xs">
                      {orderedProviders.map((providerKey) => {
                        const models = modelGroups[providerKey];
                        if (!models || models.length === 0) return null;
                        const meta = PROVIDER_META[providerKey];
                        const ProviderIcon = meta?.Icon;
                        return (
                          <div key={providerKey}>
                            <div className="flex items-center gap-2 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50">
                                {ProviderIcon ? (
                                  <ProviderIcon className="h-3.5 w-3.5 text-neutral-600" />
                                ) : (
                                  meta?.label?.slice(0, 2).toUpperCase()
                                )}
                              </span>
                              {meta?.label ?? providerKey}
                            </div>
                            <div className="space-y-1">
                              {models.map((modelId) => {
                                const isActive = modelId === model;
                                return (
                                  <button
                                    key={modelId}
                                    type="button"
                                    className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left ${
                                      isActive
                                        ? "border-neutral-900 bg-neutral-100"
                                        : "border-neutral-200 bg-white hover:bg-neutral-50"
                                    }`}
                                    onClick={() => handleModelChange(modelId)}
                                    role="option"
                                    aria-selected={isActive}
                                  >
                                    <span className="flex flex-col">
                                      <span className="font-semibold text-neutral-900">
                                        {formatModelLabel(modelId)}
                                      </span>
                                      <span className="text-[11px] text-neutral-500">
                                        {modelId}
                                      </span>
                                    </span>
                                    {isActive ? (
                                      <span className="text-[11px] font-semibold text-neutral-700">
                                        Active
                                      </span>
                                    ) : null}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>

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
                  <div className="space-y-2 text-neutral-800">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[[rehypeSanitize, markdownSanitizeSchema]]}
                      components={markdownComponents}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
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
            {agentDisabled ? (
              <div className="mb-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Agent is temporarily disabled.
              </div>
            ) : null}
            <div className="flex items-center gap-2">
              <input
                className="flex-1 rounded-full border border-neutral-200 px-4 py-2 text-sm"
                placeholder={agentDisabled ? "Agent disabled." : hint}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void handleSend();
                  }
                }}
                disabled={agentDisabled}
              />
              <button
                type="button"
                className="btn-primary"
                onClick={() => void handleSend()}
                disabled={isLoading || agentDisabled}
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
