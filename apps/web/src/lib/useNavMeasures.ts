import { useLayoutEffect, useState, type RefObject } from "react";

// The active tab's box; one pill slides between tabs instead of each tab painting its own.
// Labels change width with the locale and the font loading in, so it re-measures on resize.
export function useNavPill(nav: RefObject<HTMLElement | null>, deps: unknown[]) {
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);
  useLayoutEffect(() => {
    const el = nav.current;
    if (!el) return;
    const measure = () => {
      const active = el.querySelector<HTMLElement>("[aria-current='page']");
      if (active) setPill({ left: active.offsetLeft, width: active.offsetWidth });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, deps);
  return pill;
}

// The sticky header wraps to two rows on narrow screens (73px → 123px), so
// scrollIntoView targets clear its live height: index.html turns --header-h into
// scroll-padding (and skips it where the header isn't sticky).
export function useHeaderHeightVar(header: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const el = header.current;
    if (!el) return;
    const root = document.documentElement;
    const observer = new ResizeObserver(() => root.style.setProperty("--header-h", `${el.offsetHeight}px`));
    observer.observe(el);
    return () => { observer.disconnect(); root.style.removeProperty("--header-h"); };
  }, [header]);
}
