import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import type { BoardNode } from "./types";
import { NODE_H, NODE_W } from "./constants";
import { fitView, nextZoomStop, normalizeWheel, screenToBoard, wheelZoomFactor, zoomAt } from "./viewport.js";

export type View = { scale: number; x: number; y: number };

// Past this a press on empty canvas has become a pan and must not also count as a click.
const DRAG_SLOP_PX = 4;
const KEY_PAN_PX = 60;
const SHIFT_KEY_PAN_PX = 220;
const NODE_SIZE = { width: NODE_W, height: NODE_H };

/** Empty canvas (the frame or the board layer) — where a press pans instead of hitting a node. */
const isSurface = (target: EventTarget | null) =>
  target instanceof HTMLElement && target.dataset.boardSurface === "true";

/**
 * Pan and zoom for the board canvas: ctrl/⌘+wheel and trackpad pinch zoom at the cursor, wheel and
 * dragging empty space pan, two fingers pinch, and with the canvas focused arrows pan, +/- zoom and
 * 0 fits. Listeners are native (non-passive) so the page itself never zooms or scrolls underneath.
 */
export function useBoardViewport(canvasRef: RefObject<HTMLDivElement | null>, nodesRef: RefObject<BoardNode[]>) {
  const [view, setViewState] = useState<View>({ scale: 1, x: 0, y: 0 });
  const viewRef = useRef(view);
  // A pan just ended: the click that follows it is not a "click on empty canvas".
  const pannedRef = useRef(false);

  const setView = useCallback((next: View) => {
    viewRef.current = next;
    setViewState(next);
  }, []);

  const size = useCallback(() => {
    const el = canvasRef.current;
    return { width: el?.clientWidth ?? 0, height: el?.clientHeight ?? 0 };
  }, [canvasRef]);

  const center = useCallback(() => {
    const { width, height } = size();
    return { x: width / 2, y: height / 2 };
  }, [size]);

  /** Board coordinates under a client (page) point. */
  const toBoard = useCallback((clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    return screenToBoard(viewRef.current, { x: clientX - (rect?.left ?? 0), y: clientY - (rect?.top ?? 0) });
  }, [canvasRef]);

  const zoomStep = useCallback((direction: 1 | -1) => {
    const current = viewRef.current.scale;
    const target = nextZoomStop(current * 100, direction) / 100;
    setView(zoomAt(viewRef.current, center(), target / current));
  }, [center, setView]);

  const resetZoom = useCallback(() => {
    setView(zoomAt(viewRef.current, center(), 1 / viewRef.current.scale));
  }, [center, setView]);

  const fit = useCallback((nodes: BoardNode[]) => {
    setView(fitView(nodes, size(), NODE_SIZE));
  }, [setView, size]);

  /** True once, right after a pan, so the canvas click handler can ignore it. */
  const consumePan = useCallback(() => {
    const panned = pannedRef.current;
    pannedRef.current = false;
    return panned;
  }, []);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return undefined;
    const local = (event: { clientX: number; clientY: number }) => {
      const rect = el.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };
    const panBy = (dx: number, dy: number) => {
      const v = viewRef.current;
      setView({ ...v, x: v.x + dx, y: v.y + dy });
    };

    let pan: { id: number; start: { x: number; y: number }; last: { x: number; y: number }; moved: boolean } | null = null;
    const touches = new Map<number, { x: number; y: number }>();
    let pinch: { distance: number; mid: { x: number; y: number } } | null = null;

    const pinchState = () => {
      const [a, b] = [...touches.values()];
      if (!a || !b) return null;
      return { distance: Math.hypot(a.x - b.x, a.y - b.y), mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } };
    };

    const wheel = (event: WheelEvent) => {
      if (event.cancelable) event.preventDefault();
      if (event.ctrlKey || event.metaKey) {
        setView(zoomAt(viewRef.current, local(event), wheelZoomFactor(event.deltaY)));
      } else {
        const { dx, dy } = normalizeWheel(event.deltaX, event.deltaY, event.deltaMode, size());
        panBy(-dx, -dy);
      }
    };

    const pointerDown = (event: PointerEvent) => {
      if (event.pointerType === "touch") {
        touches.set(event.pointerId, local(event));
        if (touches.size === 2) {
          // A second finger turns whatever the first was doing into a pinch.
          pan = null;
          pinch = pinchState();
          return;
        }
      }
      if (!isSurface(event.target) || (event.button !== 0 && event.button !== 1)) return;
      const point = local(event);
      pan = { id: event.pointerId, start: point, last: point, moved: false };
      // Capture keeps the pan going if the pointer leaves the canvas; a pointer that is already gone can't be captured.
      try { el.setPointerCapture(event.pointerId); } catch { /* ignore */ }
    };

    const pointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch" && touches.has(event.pointerId)) {
        touches.set(event.pointerId, local(event));
        if (pinch) {
          const next = pinchState();
          if (!next || next.distance === 0) return;
          const zoomed = zoomAt(viewRef.current, next.mid, next.distance / pinch.distance);
          // Moving both fingers together pans as well.
          setView({ ...zoomed, x: zoomed.x + next.mid.x - pinch.mid.x, y: zoomed.y + next.mid.y - pinch.mid.y });
          pinch = next;
          return;
        }
      }
      if (!pan || pan.id !== event.pointerId) return;
      const point = local(event);
      if (!pan.moved && Math.hypot(point.x - pan.start.x, point.y - pan.start.y) > DRAG_SLOP_PX) {
        pan.moved = true;
        el.dataset.panning = "true";
      }
      if (pan.moved) panBy(point.x - pan.last.x, point.y - pan.last.y);
      pan.last = point;
    };

    const pointerUp = (event: PointerEvent) => {
      touches.delete(event.pointerId);
      if (touches.size < 2) pinch = null;
      if (!pan || pan.id !== event.pointerId) return;
      if (pan.moved) pannedRef.current = true;
      pan = null;
      delete el.dataset.panning;
    };

    const keydown = (event: KeyboardEvent) => {
      // Only when the canvas itself is focused: nodes use arrows to move themselves.
      if (event.target !== el || event.metaKey || event.ctrlKey || event.altKey) return;
      const step = event.shiftKey ? SHIFT_KEY_PAN_PX : KEY_PAN_PX;
      const pans: Record<string, [number, number]> = {
        ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step],
      };
      const panKey = pans[event.key];
      if (panKey) panBy(panKey[0], panKey[1]);
      else if (event.key === "+" || event.key === "=") zoomStep(1);
      else if (event.key === "-") zoomStep(-1);
      else if (event.key === "0") fit(nodesRef.current ?? []);
      else return;
      event.preventDefault();
    };

    el.addEventListener("wheel", wheel, { passive: false });
    el.addEventListener("pointerdown", pointerDown);
    el.addEventListener("pointermove", pointerMove);
    el.addEventListener("pointerup", pointerUp);
    el.addEventListener("pointercancel", pointerUp);
    el.addEventListener("keydown", keydown);
    return () => {
      el.removeEventListener("wheel", wheel);
      el.removeEventListener("pointerdown", pointerDown);
      el.removeEventListener("pointermove", pointerMove);
      el.removeEventListener("pointerup", pointerUp);
      el.removeEventListener("pointercancel", pointerUp);
      el.removeEventListener("keydown", keydown);
    };
  }, [canvasRef, fit, nodesRef, setView, size, zoomStep]);

  return { view, setView, toBoard, zoomStep, resetZoom, fit, consumePan };
}
