"use client";

import { useEffect, useMemo, useState } from "react";

interface AgentConversation {
  id: string;
  sessionId: string;
  title: string;
  summary?: string;
  lastMessageAt?: string;
}

export function AgentHistoryPanel() {
  const [query, setQuery] = useState("");
  const [conversations, setConversations] = useState<AgentConversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchConversations = async (search?: string) => {
    setIsLoading(true);
    try {
      const endpoint = search
        ? `/api/agent/conversations/search?q=${encodeURIComponent(search)}`
        : "/api/agent/conversations";
      const response = await fetch(endpoint);
      if (!response.ok) return;
      const data = (await response.json()) as {
        conversations?: AgentConversation[];
      };
      setConversations(data.conversations ?? []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchConversations();
  }, []);

  const filtered = useMemo(() => conversations, [conversations]);

  const handleRename = async (conversationId: string, title: string) => {
    const nextTitle = title.trim();
    if (!nextTitle) return;
    const response = await fetch(
      `/api/agent/conversations/${conversationId}/rename`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: nextTitle }),
      }
    );
    if (response.ok) {
      void fetchConversations(query);
    }
  };

  const handleDelete = async (conversationId: string) => {
    const response = await fetch(`/api/agent/conversations/${conversationId}`, {
      method: "DELETE",
    });
    if (response.ok) {
      void fetchConversations(query);
    }
  };

  return (
    <div className="rounded-3xl border border-neutral-200/70 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase text-neutral-400">Saved sessions</p>
          <h2 className="mt-2 text-2xl font-semibold text-neutral-900">
            Conversation history
          </h2>
          <p className="mt-2 text-sm text-neutral-600">
            Resume, rename, or delete past chats with your AI agent.
          </p>
        </div>
        <form
          className="flex w-full max-w-xs items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void fetchConversations(query);
          }}
        >
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search titles or summaries"
            className="w-full rounded-full border border-neutral-200 px-4 py-2 text-sm"
          />
          <button type="submit" className="btn-secondary">
            Search
          </button>
        </form>
      </div>

      <div className="mt-6 space-y-3">
        {isLoading ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 p-6 text-sm text-neutral-500">
            Loading conversations...
          </div>
        ) : null}

        {!isLoading && filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 p-6 text-sm text-neutral-500">
            No conversations yet.
          </div>
        ) : null}

        {filtered.map((conversation) => (
          <div
            key={conversation.id}
            className="rounded-2xl border border-neutral-200/70 bg-neutral-50 p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-neutral-900">
                  {conversation.title}
                </p>
                {conversation.summary ? (
                  <p className="mt-1 text-xs text-neutral-500">
                    {conversation.summary}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() =>
                    handleRename(
                      conversation.id,
                      prompt("Rename conversation", conversation.title) ||
                        conversation.title
                    )
                  }
                >
                  Rename
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => handleDelete(conversation.id)}
                >
                  Delete
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    window.localStorage.setItem(
                      "experimentein_agent_session",
                      conversation.sessionId
                    );
                    window.localStorage.setItem(
                      "experimentein_agent_conversation",
                      conversation.id
                    );
                    window.localStorage.setItem(
                      "experimentein_agent_autostart",
                      "1"
                    );
                    window.location.href = "/dashboard";
                  }}
                >
                  Resume
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
