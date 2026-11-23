'use client';

import { useEffect, useRef, useState } from 'react';
import { Bot, Send, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { apiGet, apiPost } from '@/lib/api';
import styles from './chat.module.css';

type Msg = {
  id: string;
  role: string;
  content: string;
  metadata?: { citations?: string[]; intent?: string };
};

const QUICK_PROMPTS = [
  'When is my next live class?',
  'My payment DEMO-REV-pending-001 is still pending',
  'I want to raise a support ticket',
  'Video keeps buffering on Android',
];

function formatInlineBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export function SupportChat({ variant = 'embedded' }: { variant?: 'embedded' | 'page' }) {
  const { token, user } = useAuth();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!token) return;
    setBooting(true);
    apiPost<{ id: string }>(token, '/v1/conversations', {
      channel: 'web_chat',
    })
      .then((c) => {
        setConversationId(c.id);
        return apiGet<{ messages: Msg[] }>(token, `/v1/conversations/${c.id}`);
      })
      .then((conv) => setMessages(conv.messages ?? []))
      .catch((e) => setError(e.message))
      .finally(() => setBooting(false));
  }, [token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function send(preset?: string) {
    const text = (preset ?? input).trim();
    if (!token || !conversationId || !text || loading) return;
    setLoading(true);
    setError(null);
    if (!preset) setInput('');
    setMessages((m) => [
      ...m,
      { id: `local-${Date.now()}`, role: 'user', content: text },
    ]);
    try {
      const data = await apiPost<{
        message: Msg;
        intent?: string;
        citations?: string[];
      }>(token, `/v1/conversations/${conversationId}/messages`, {
        content: text,
      });
      setMessages((m) => [...m, data.message]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Send failed');
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  const userInitial = user?.displayName?.charAt(0)?.toUpperCase() ?? 'U';

  return (
    <div
      className={
        variant === 'page' ? styles.chatPanelPage : styles.chatPanel
      }
    >
      <header className={styles.chatHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.aiAvatar} aria-hidden>
            <Bot size={22} strokeWidth={1.75} />
          </div>
          <div>
            <div className={styles.chatTitle}>BrightPath AI support</div>
            <p className={styles.chatSub}>
              Schedules, payments, and policies from your account — not guesses.
            </p>
          </div>
        </div>
        <span className={styles.statusPill}>
          <span className={styles.statusDot} aria-hidden />
          Live
        </span>
      </header>

      {error ? <div className={styles.errorBanner}>{error}</div> : null}

      <div className={styles.messages}>
        {booting ? (
          <div className={styles.messageRowAi}>
            <span className={styles.msgAvatarAi}>
              <Sparkles size={14} />
            </span>
            <div className={styles.bubbleLoading}>
              <div className={styles.typing}>
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        ) : null}

        {!booting && messages.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <Sparkles size={24} />
            </div>
            <p className={styles.hint}>
              Hi{user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}! Ask anything about your courses, or tap a suggestion below.
            </p>
            <div className={styles.suggestions}>
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className={styles.suggestionBtn}
                  disabled={loading}
                  onClick={() => send(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className={isUser ? styles.messageRowUser : styles.messageRowAi}
            >
              <span
                className={isUser ? styles.msgAvatarUser : styles.msgAvatarAi}
                aria-hidden
              >
                {isUser ? (
                  userInitial
                ) : (
                  <Sparkles size={14} />
                )}
              </span>
              <div className={isUser ? styles.bubbleUser : styles.bubbleAi}>
                {!isUser && (
                  <span className={styles.aiTag}>
                    <Bot size={12} />
                    Assistant
                  </span>
                )}
                <p className={styles.bubbleText}>
                  {formatInlineBold(m.content)}
                </p>
                {m.metadata?.citations?.length ? (
                  <div className={styles.cites}>
                    {m.metadata.citations.map((c) => (
                      <span key={c} className={styles.citePill}>
                        {c}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}

        {loading ? (
          <div className={styles.messageRowAi}>
            <span className={styles.msgAvatarAi}>
              <Sparkles size={14} />
            </span>
            <div className={styles.bubbleLoading}>
              <span className={styles.aiTag}>
                <Bot size={12} />
                Thinking
              </span>
              <div className={styles.typing}>
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        ) : null}

        <div ref={messagesEndRef} />
      </div>

      <div className={styles.compose}>
        <div className={styles.composeInner}>
          <textarea
            ref={inputRef}
            className={styles.input}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your issue…"
            disabled={loading || booting}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <button
            type="button"
            className={styles.sendBtn}
            onClick={() => send()}
            disabled={loading || booting || !input.trim()}
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </div>
        <p className={styles.composeHint}>
          Enter to send · Shift+Enter for new line · Refunds need finance approval
        </p>
      </div>
    </div>
  );
}