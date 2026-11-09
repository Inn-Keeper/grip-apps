import { useEffect, useState } from "react";
import { POE_ASSISTANT_PREF_EVENT, POE_ASSISTANT_VISIBLE_KEY, poeVisibleByDefault } from "./poeAssistantUtils";
import { measureChatViewport } from "./chatViewport.js";

/** Mobile keyboards can shrink/pan only the visual viewport, leaving fixed elements behind. */
export function useChatViewport(open: boolean) {
  const measure = () => measureChatViewport(window.visualViewport, window.innerHeight);
  const [viewport, setViewport] = useState(measure);
  useEffect(() => {
    const visual = window.visualViewport;
    const update = () => setViewport(measure());
    update();
    window.addEventListener("resize", update);
    // While closed only window resize matters; opening takes a fresh measurement.
    if (open) {
      visual?.addEventListener("resize", update);
      visual?.addEventListener("scroll", update);
    }
    return () => {
      window.removeEventListener("resize", update);
      visual?.removeEventListener("resize", update);
      visual?.removeEventListener("scroll", update);
    };
  }, [open]);
  return viewport;
}

/** Whether the reacting mascot is shown on Prep (Profile toggle, synced across tabs). */
export function usePoeMascotVisible(): boolean {
  const [visible, setVisible] = useState(poeVisibleByDefault);
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
  return visible;
}

/** Pixels of footer on screen, so fixed Poe elements slide up and never cover it. */
export function useFooterLift(): number {
  const [lift, setLift] = useState(0);
  useEffect(() => {
    const footer = document.querySelector("footer");
    if (!footer) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) setLift(Math.round(entry.boundingClientRect.height * entry.intersectionRatio));
      },
      { threshold: Array.from({ length: 101 }, (_, i) => i / 100) },
    );
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);
  return lift;
}
