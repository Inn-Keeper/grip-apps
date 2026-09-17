import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { brand, colors } from "@grip/core/tokens";
import {
  POE_ASSISTANT_PREF_EVENT,
  POE_ASSISTANT_VISIBLE_KEY,
  poeLineFor,
  poeVisibleByDefault,
} from "./poeAssistantUtils";
import styles from "./PoeAssistant.module.css";

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
  const [visible, setVisible] = useState(poeVisibleByDefault);
  const [mood, setMood] = useState("idle");
  const [message, setMessage] = useState("");
  const [messageKey, setMessageKey] = useState(0);
  const [shining, setShining] = useState(false);
  const [footerLift, setFooterLift] = useState(0);
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

  useEffect(() => {
    const onPreference = (event: Event) => setVisible((event as CustomEvent).detail?.visible ?? poeVisibleByDefault());
    const onStorage = (event: StorageEvent) => {
      if (event.key === POE_ASSISTANT_VISIBLE_KEY) setVisible(poeVisibleByDefault());
    };
    window.addEventListener(POE_ASSISTANT_PREF_EVENT, onPreference);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(POE_ASSISTANT_PREF_EVENT, onPreference);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => () => {
    if (resetTimer.current) window.clearTimeout(resetTimer.current);
  }, []);

  useEffect(() => {
    if (shineTimer.current) window.clearTimeout(shineTimer.current);
    if (shineEndTimer.current) window.clearTimeout(shineEndTimer.current);
    setShining(false);
    if (!visible || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    const scheduleShine = () => {
      shineTimer.current = window.setTimeout(() => {
        setShining(true);
        shineEndTimer.current = window.setTimeout(() => {
          setShining(false);
          scheduleShine();
        }, SHINE_MS);
      }, SHINE_MIN_MS + Math.random() * SHINE_SPREAD_MS);
    };

    scheduleShine();
    return () => {
      if (shineTimer.current) window.clearTimeout(shineTimer.current);
      if (shineEndTimer.current) window.clearTimeout(shineEndTimer.current);
    };
  }, [visible]);

  useEffect(() => {
    if (!cue?.type) return;
    showReaction(cue.type, cue.id ?? Date.now());
  }, [cue, showReaction]);

  // Slide Poe up when the footer scrolls into view so he never covers it.
  useEffect(() => {
    const footer = document.querySelector("footer");
    if (!footer) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        const visible = entry.boundingClientRect.height * entry.intersectionRatio;
        setFooterLift(Math.round(visible));
      },
      { threshold: Array.from({ length: 101 }, (_, i) => i / 100) }
    );
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  const imageSrc = (poseByMood as Record<string, string>)[mood] ?? poseByMood.idle;
  const accent = mood === "wrong" ? colors.warningBright : mood === "levelUp" ? colors.successBright : colors.accentBright;
  const label = useMemo(() => `${brand.mascotName}, ${brand.productName}'s raven guide`, []);

  if (!visible) return null;

  return (
    <aside
      className={`${styles.assistant} ${styles[mood]} ${shining ? styles.shine : ""}`}
      aria-label={label}
      style={{ "--poe-lift": `${footerLift}px` } as React.CSSProperties}
    >
      {message && (
        <div key={messageKey} className={styles.quote} style={{ "--poe-accent": accent } as React.CSSProperties} aria-live="polite">
          {message}
        </div>
      )}
      <button
        type="button"
        className={styles.perch}
        onClick={() => showReaction("thinking")}
        aria-label={`Ask ${brand.mascotName} for a thought`}
        title={`Ask ${brand.mascotName} for a thought`}
      >
        <img className={styles.image} src={imageSrc} alt="" draggable="false" />
      </button>
    </aside>
  );
}
