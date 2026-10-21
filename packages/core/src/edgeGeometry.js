// Arrow geometry shared by the web and mobile boards: an S-curve between the sides
// of two nodes that face each other. Side by side, it leaves a left or right side;
// one above the other, it leaves the top or bottom and bends vertically.

/** @typedef {{ sx: number, sy: number, tx: number, ty: number, mx: number, vertical: boolean }} EdgeGeometry */

/**
 * @param {{ x: number, y: number }} a @param {{ x: number, y: number }} b
 * @param {{ width: number, height: number }} size node size, or the source's when sizes differ
 * @param {{ width: number, height: number }} [sizeB] the target's size (resized nodes differ)
 * @returns {EdgeGeometry}
 */
export function edgeGeometry(a, b, size, sizeB = size) {
  const dx = b.x + sizeB.width / 2 - (a.x + size.width / 2);
  const dy = b.y + sizeB.height / 2 - (a.y + size.height / 2);
  // Vertical when the empty space between them runs more up and down than across.
  const gapX = Math.abs(dx) - (size.width + sizeB.width) / 2;
  const gapY = Math.abs(dy) - (size.height + sizeB.height) / 2;
  if (gapY > gapX) {
    const sx = a.x + size.width / 2;
    const sy = a.y + (dy >= 0 ? size.height : 0);
    const tx = b.x + sizeB.width / 2;
    const ty = b.y + (dy >= 0 ? 0 : sizeB.height);
    return { sx, sy, tx, ty, mx: (sx + tx) / 2, vertical: true };
  }
  const sx = a.x + (b.x >= a.x ? size.width : 0);
  const sy = a.y + size.height / 2;
  const tx = b.x + (b.x >= a.x ? 0 : sizeB.width);
  const ty = b.y + sizeB.height / 2;
  return { sx, sy, tx, ty, mx: (sx + tx) / 2, vertical: false };
}

/** The curve's two control points: halfway across for a side-by-side arrow, halfway down for a vertical one. @param {EdgeGeometry} g */
function controls({ sx, sy, tx, ty, mx, vertical }) {
  const my = (sy + ty) / 2;
  return vertical ? [sx, my, tx, my] : [mx, sy, mx, ty];
}

/** @param {EdgeGeometry} g */
export const bezierPath = (g) => {
  const [c1x, c1y, c2x, c2y] = controls(g);
  return `M ${g.sx} ${g.sy} C ${c1x} ${c1y} ${c2x} ${c2y} ${g.tx} ${g.ty}`;
};

/** Arrowhead at the target, pointing along the curve's last stretch. @param {EdgeGeometry} g */
export function arrowheadPath(g) {
  const [, , c2x, c2y] = controls(g);
  const angle = Math.atan2(g.ty - c2y, g.tx - c2x);
  const bx = g.tx - 9 * Math.cos(angle);
  const by = g.ty - 9 * Math.sin(angle);
  const nx = -Math.sin(angle) * 5;
  const ny = Math.cos(angle) * 5;
  return `M ${g.tx} ${g.ty} L ${bx + nx} ${by + ny} L ${bx - nx} ${by - ny} Z`;
}

/** Triangle for an arrowhead at `tip`, pointing away from `from`: free arrows and lines on both boards. */
export function headPoints(from, tip, length = 10, spread = 5) {
  const angle = Math.atan2(tip.y - from.y, tip.x - from.x);
  const back = { x: tip.x - length * Math.cos(angle), y: tip.y - length * Math.sin(angle) };
  const nx = -Math.sin(angle) * spread;
  const ny = Math.cos(angle) * spread;
  return `${tip.x},${tip.y} ${back.x + nx},${back.y + ny} ${back.x - nx},${back.y - ny}`;
}

/** Distance from a tap to the closest of `samples` points along the curve. @param {EdgeGeometry} geometry */
export function distanceToEdge(geometry, px, py, samples = 16) {
  const { sx, sy, tx, ty } = geometry;
  const [c1x, c1y, c2x, c2y] = controls(geometry);
  let min = Infinity;
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const u = 1 - t;
    const bx = u ** 3 * sx + 3 * u ** 2 * t * c1x + 3 * u * t ** 2 * c2x + t ** 3 * tx;
    const by = u ** 3 * sy + 3 * u ** 2 * t * c1y + 3 * u * t ** 2 * c2y + t ** 3 * ty;
    min = Math.min(min, Math.hypot(bx - px, by - py));
  }
  return min;
}
