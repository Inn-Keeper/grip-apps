// Pan/zoom math for the Arch Board canvas. A view maps board coordinates onto the
// screen: screen = board * scale + (x, y). Pure functions so the gestures stay testable.

export const MIN_SCALE = 0.25;
export const MAX_SCALE = 2;
// A single wheel event never counts for more than this, however the device reports it.
const WHEEL_DELTA_LIMIT = 100;
const WHEEL_ZOOM_SENSITIVITY = 0.01;
const PIXELS_PER_LINE = 16;

export const clampScale = (scale) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));

/** Board point under a screen point (both relative to the canvas top-left). */
export function screenToBoard(view, point) {
  return { x: (point.x - view.x) / view.scale, y: (point.y - view.y) / view.scale };
}

/** Zoom by `factor` while the board point under `anchor` stays under it. */
export function zoomAt(view, anchor, factor) {
  const scale = clampScale(view.scale * factor);
  const ratio = scale / view.scale;
  return { scale, x: anchor.x - (anchor.x - view.x) * ratio, y: anchor.y - (anchor.y - view.y) * ratio };
}

/** Wheel delta → zoom factor. Trackpad pinches arrive as small ctrl+wheel deltas, mouse wheels as big ones. */
export function wheelZoomFactor(deltaY) {
  const delta = Math.max(-WHEEL_DELTA_LIMIT, Math.min(WHEEL_DELTA_LIMIT, deltaY));
  return Math.exp(-delta * WHEEL_ZOOM_SENSITIVITY);
}

/** Line and page wheel modes (Firefox) → pixels. */
export function normalizeWheel(dx, dy, mode, size) {
  const unit = (page) => (mode === 1 ? PIXELS_PER_LINE : mode === 2 ? page : 1);
  return { dx: dx * unit(size.width), dy: dy * unit(size.height) };
}

// Ten-percent stops stepped from the current value, so repeated presses land on 90%, 80%…
// instead of drifting to 83% or 144%. ARRIVED treats a value within half a percent as on its stop.
const STOP = 10;
const ARRIVED = 0.05;

export function nextZoomStop(percent, direction) {
  const grid = percent / STOP;
  const next = direction > 0 ? Math.floor(grid + ARRIVED) + 1 : Math.ceil(grid - ARRIVED) - 1;
  return Math.min(MAX_SCALE * 100, Math.max(MIN_SCALE * 100, next * STOP));
}

/** Frames every node with padding; never enlarges past `maxScale` so small boards stay readable. */
export function fitView(nodes, size, nodeSize, { padding = 40, maxScale = 1 } = {}) {
  if (nodes.length === 0) return { scale: 1, x: 0, y: 0 };
  const minX = Math.min(...nodes.map((n) => n.x)) - padding;
  const minY = Math.min(...nodes.map((n) => n.y)) - padding;
  const maxX = Math.max(...nodes.map((n) => n.x + nodeSize.width)) + padding;
  const maxY = Math.max(...nodes.map((n) => n.y + nodeSize.height)) + padding;
  const scale = clampScale(Math.min(size.width / (maxX - minX), size.height / (maxY - minY), maxScale));
  return {
    scale,
    x: (size.width - (maxX - minX) * scale) / 2 - minX * scale,
    y: (size.height - (maxY - minY) * scale) / 2 - minY * scale,
  };
}
