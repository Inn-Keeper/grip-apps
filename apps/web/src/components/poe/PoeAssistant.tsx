import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { brand } from "@grip/core/tokens";
import { t } from "@grip/core/i18n";
import { colors } from "../../lib/tokens";
import { poeLineFor } from "./poeAssistantUtils";
import { useFooterLift, usePoeMascotVisible } from "./usePoeHooks";
import styles from "./PoeAssistant.module.css";
import { PoeIdle } from "./PoeIdle";
import { usePoeChat } from "./poeChatContext";

const REACTION_MS = 3600;
const SHINE_MS = 1400;
const SHINE_MIN_MS = 9000;
const SHINE_SPREAD_MS = 12000;

const poseByMood = {
  idle: "/mascot/poe-idle.png",
  correct: "/mascot/poe-correct.png",
  wrong: "/mascot/poe-wrong.png",
  levelUp: "/mascot/poe-correct.png",
  thinking: "/mascot/poe-thinking.png",
};

type Cue = { type: string; id?: number } | null;
export function PoeAssistant({ cue }: { cue: Cue }) {
  const visible = usePoeMascotVisible();
  const chat = usePoeChat();
  const chatOpen = chat?.open ?? false;
  // A ref, so closing the chat does not replay the last cue.
  const chatOpenRef = useRef(chatOpen);
  chatOpenRef.current = chatOpen;
  const [mood, setMood] = useState("idle");
  const [message, setMessage] = useState("");
  const [messageKey, setMessageKey] = useState(0);
  const [shining, setShining] = useState(false);
  const footerLift = useFooterLift();
  const resetTimer = useRef<number | null>(null);
  const shineTimer = useRef<number | null>(null);
  const shineEndTimer = useRef<number | null>(null);

  const showReaction = useCallback((type: string, seed = Date.now()) => {
    const nextMood = (poseByMood as Record<string, string>)[type] ? type : "thinking";
    if (resetTimer.current) window.clearTimeout(resetTimer.current);
    setMood(nextMood);
    setMessage(poeLineFor(nextMood, seed));
    setMessageKey(seed);
    resetTimer.current = window.setTimeout(() => {
      setMood("idle");
      setMessage("");
    }, REACTION_MS);
  }, []);

  useEffect(
    () => () => {
      if (resetTimer.current) window.clearTimeout(resetTimer.current);
    },
    [],
  );

  useEffect(() => {
    if (shineTimer.current) window.clearTimeout(shineTimer.current);
    if (shineEndTimer.current) window.clearTimeout(shineEndTimer.current);
    setShining(false);
    if (!visible || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    const scheduleShine = () => {
      shineTimer.current = window.setTimeout(
        () => {
          setShining(true);
          shineEndTimer.current = window.setTimeout(() => {
            setShining(false);
            scheduleShine();
          }, SHINE_MS);
        },
        SHINE_MIN_MS + Math.random() * SHINE_SPREAD_MS,
      );
    };

    scheduleShine();
    return () => {
      if (shineTimer.current) window.clearTimeout(shineTimer.current);
      if (shineEndTimer.current) window.clearTimeout(shineEndTimer.current);
    };
  }, [visible]);

  // Reactions would float over the chat panel, so they wait while it is open.
  useEffect(() => {
    if (!cue?.type || chatOpenRef.current) return;
    showReaction(cue.type, cue.id ?? Date.now());
  }, [cue, showReaction]);

  useEffect(() => {
    if (!chatOpen) return;
    if (resetTimer.current) window.clearTimeout(resetTimer.current);
    setMood("idle");
    setMessage("");
  }, [chatOpen]);

  const imageSrc = (poseByMood as Record<string, string>)[mood] ?? poseByMood.idle;
  const accent =
    mood === "wrong" ? colors.warningBright : mood === "levelUp" ? colors.successBright : colors.accentBright;
  const label = useMemo(() => `${brand.mascotName}, ${brand.productName}'s raven guide`, []);

  if (!visible) return null;

  return (
    <aside
      // "resting": idle with nothing to say. Where Poe would sit on top of content (narrow or
      // short screens), the stylesheet hides him while resting, so he only covers a spot
      // for the moment he reacts (rule 7).
      className={`${styles.assistant} ${styles[mood]} ${shining ? styles.shine : ""} ${mood === "idle" && !message ? styles.resting : ""}`}
      aria-label={label}
      style={{ "--poe-lift": `${footerLift}px` } as React.CSSProperties}
    >
      {message && (
        <div
          key={messageKey}
          className={styles.quote}
          style={{ "--poe-accent": accent } as React.CSSProperties}
          aria-live="polite"
        >
          {message}
        </div>
      )}
      <button
        type="button"
        className={styles.perch}
        // Without a chat (no AI URL, or the API has no Gemini) Poe keeps his old thought line.
        onClick={() => (chat && !chat.unavailable ? chat.setOpen(!chat.open) : showReaction("thinking"))}
        aria-label={chat && !chat.unavailable ? t("poe.chat.label") : `Ask ${brand.mascotName} for a thought`}
        aria-expanded={chat && !chat.unavailable ? chat.open : undefined}
        title={chat && !chat.unavailable ? t("poe.chat.label") : `Ask ${brand.mascotName} for a thought`}
      >
        {mood === "idle" ? (
          <PoeIdle />
        ) : (
          <img
            className={styles.image}
            src={imageSrc}
            alt=""
            draggable="false"
          />
        )}
      </button>
    </aside>
  );
}
