import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getLocale, t } from "@grip/core/i18n";
import { POE_LIMITS } from "@grip/core/poeChat";
import { poeChat } from "../../lib/api";
import { canSend, isUnavailable } from "./poeChatState.js";
import { PoeChatContext, poeHistoryKey, usePoeChat, type Turn } from "./poeChatContext";
import { useChatViewport, useFooterLift } from "./usePoeHooks";
import styles from "./PoeChat.module.css";
import mascotStyles from "./PoeAssistant.module.css";

function loadHistory(key: string): Turn[] {
  try {
    const saved = JSON.parse(window.localStorage.getItem(key) ?? "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

export function PoeChatProvider({ userId, children }: { userId: string; children: React.ReactNode }) {
  const storageKey = poeHistoryKey(userId);
  const [open, setOpenState] = useState(false);
  const [messages, setMessages] = useState<Turn[]>(() => loadHistory(storageKey));
  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch {
      // Storage full or blocked: the chat still works for this page load.
    }
  }, [storageKey, messages]);
  const [pending, setPending] = useState(false);
  // No AI URL means no chat at all; the mascot then keeps its thought line.
  const [unavailable, setUnavailable] = useState(!poeChat);
  const [errorLine, setErrorLine] = useState("");
  const opener = useRef<HTMLElement | null>(null);
  // State updates are async, so two Sends in one tick both see pending=false; the ref does not.
  const inFlight = useRef(false);

  const setOpen = useCallback((next: boolean) => {
    if (next) opener.current = document.activeElement as HTMLElement | null;
    else opener.current?.focus();
    setOpenState(next);
  }, []);

  const send = useCallback(
    async (text: string) => {
      if (!poeChat || !canSend(text, inFlight.current)) return false;
      inFlight.current = true;
      const history: Turn[] = [...messages, { role: "user", text: text.trim() }];
      setMessages(history);
      setErrorLine("");
      setPending(true);
      try {
        const reply = await poeChat.ask(history, { locale: getLocale() });
        setMessages((current) => [...current, { role: "poe", text: reply }]);
        return true;
      } catch (error) {
        if (isUnavailable(error)) {
          setUnavailable(true);
          setOpenState(false);
        }
        // The failed question leaves the history so a retry does not send it twice.
        setMessages((current) => current.slice(0, -1));
        setErrorLine((error as Error)?.message || t("poe.chat.error"));
        return false;
      } finally {
        inFlight.current = false;
        setPending(false);
      }
    },
    [messages],
  );

  const value = useMemo(
    () => ({ open, setOpen, unavailable, messages, pending, send, errorLine }),
    [open, setOpen, unavailable, messages, pending, send, errorLine],
  );
  return <PoeChatContext.Provider value={value}>{children}</PoeChatContext.Provider>;
}

export function PoeChat({ showBubble }: { showBubble: boolean }) {
  const chat = usePoeChat();
  const lift = useFooterLift();
  const viewport = useChatViewport(!!chat?.open);
  if (!chat || !poeChat || chat.unavailable) return null;
  const position = {
    "--poe-lift": `${lift}px`,
    "--chat-viewport-height": `${viewport.height}px`,
    "--chat-keyboard-inset": `${viewport.bottom}px`,
  } as React.CSSProperties;

  return (
    <>
      {chat.open && <PoeChatPanel style={position} besideMascot={!showBubble} />}
      <button
        type="button"
        className={`${styles.bubble}${showBubble ? "" : ` ${mascotStyles.chatAlternative}`}`}
        style={position}
        onClick={() => chat.setOpen(!chat.open)}
        aria-label={t("poe.chat.label")}
        aria-expanded={chat.open}
        title={t("poe.chat.label")}
      >
        <img
          src="/mascot/poe-idle.png"
          alt=""
          draggable="false"
        />
      </button>
    </>
  );
}

function PoeChatPanel({ style, besideMascot }: { style: React.CSSProperties; besideMascot: boolean }) {
  const chat = usePoeChat()!;
  const [draft, setDraft] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);

  useEffect(() => input.current?.focus(), []);
  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight });
  }, [chat.messages, chat.pending, chat.errorLine]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const text = draft;
    // Clear optimistically; restore the text if Poe could not answer.
    setDraft("");
    if (!(await chat.send(text))) setDraft(text);
  };

  return (
    <div
      role="dialog"
      aria-label={t("poe.chat.label")}
      className={`${styles.panel}${besideMascot ? ` ${styles.panelBesideMascot}` : ""}`}
      style={style}
      onKeyDown={(event) => {
        if (event.key === "Escape") chat.setOpen(false);
      }}
    >
      <div className={styles.header}>
        <span>Poe</span>
        <button
          type="button"
          className={styles.close}
          onClick={() => chat.setOpen(false)}
          aria-label={t("poe.chat.close")}
        >
          ×
        </button>
      </div>
      <div
        className={styles.messages}
        ref={list}
        aria-live="polite"
      >
        <p className={styles.poe}>{t("poe.chat.greeting")}</p>
        {chat.messages.map((turn, i) => (
          <p
            key={i}
            className={turn.role === "poe" ? styles.poe : styles.user}
          >
            {turn.text}
          </p>
        ))}
        {chat.pending && (
          <p
            className={`${styles.poe} ${styles.typing}`}
            aria-label="…"
          >
            {Array.from({ length: 3 }).map((_, i) => (
              <span
                key={i}
                className={styles.dot}
                aria-hidden="true"
              >
                .
              </span>
            ))}
          </p>
        )}
        {chat.errorLine && <p className={`${styles.poe} ${styles.error}`}>{chat.errorLine}</p>}
      </div>
      <p className={styles.privacy}>{t("poe.chat.privacy")}</p>
      <form
        className={styles.form}
        onSubmit={submit}
      >
        <input
          ref={input}
          className={styles.input}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={POE_LIMITS.userChars}
          placeholder={t("poe.chat.placeholder")}
          aria-label={t("poe.chat.placeholder")}
        />
        <button
          type="submit"
          className={styles.send}
          disabled={!canSend(draft, chat.pending)}
        >
          {t("poe.chat.send")}
        </button>
      </form>
    </div>
  );
}
