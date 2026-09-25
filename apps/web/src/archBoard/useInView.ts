import { useCallback, useRef, useState } from "react";

// A callback ref that reports whether its element is on screen. Callback, not
// object ref: the watched elements mount and unmount as the workflow step changes.
// The sticky rail covers the top 90px, so anything under it counts as hidden.
export function useInView(whenAbsent: boolean) {
  const [visible, setVisible] = useState(whenAbsent);
  const observer = useRef<IntersectionObserver | null>(null);
  const ref = useCallback(
    (node: HTMLDivElement | null) => {
      observer.current?.disconnect();
      if (!node) {
        setVisible(whenAbsent);
        return;
      }
      observer.current = new IntersectionObserver(
        (entries) => setVisible(entries[entries.length - 1]?.isIntersecting ?? whenAbsent),
        { rootMargin: "-90px 0px 0px 0px" },
      );
      observer.current.observe(node);
    },
    [whenAbsent],
  );
  return [visible, ref] as const;
}
