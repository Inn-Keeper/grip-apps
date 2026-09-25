// Arrow geometry shared by the web and mobile boards: a horizontal S-curve from
// the facing side of one node to the facing side of the other.

/** @typedef {{ sx: number, sy: number, tx: number, ty: number, mx: number }} EdgeGeometry */

/**
 * @param {{ x: number, y: number }} a @param {{ x: number, y: number }} b
 * @param {{ width: number, height: number }} size node size
 * @returns {EdgeGeometry}
 */
export function edgeGeometry(a, b, size) {
  const sx = a.x + (b.x >= a.x ? size.width : 0);
  const sy = a.y + size.height / 2;
  const tx = b.x + (b.x >= a.x ? 0 : size.width);
  const ty = b.y + size.height / 2;
  return { sx, sy, tx, ty, mx: (sx + tx) / 2 };
}

/** @param {EdgeGeometry} g */
export const bezierPath = ({ sx, sy, tx, ty, mx }) => `M ${sx} ${sy} C ${mx} ${sy} ${mx} ${ty} ${tx} ${ty}`;

/** @param {EdgeGeometry} g */
export function arrowheadPath({ tx, ty, mx }) {
  const direction = tx >= mx ? 1 : -1;
  const back = tx - 9 * direction;
  return `M ${tx} ${ty} L ${back} ${ty - 5} L ${back} ${ty + 5} Z`;
}

/** Distance from a tap to the closest of `samples` points along the curve. @param {EdgeGeometry} geometry */
export function distanceToEdge(geometry, px, py, samples = 16) {
  const { sx, sy, tx, ty, mx } = geometry;
  let min = Infinity;
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const u = 1 - t;
    // Cubic bezier with control points (mx, sy) and (mx, ty).
    const bx = u ** 3 * sx + 3 * u ** 2 * t * mx + 3 * u * t ** 2 * mx + t ** 3 * tx;
    const by = u ** 3 * sy + 3 * u ** 2 * t * sy + 3 * u * t ** 2 * ty + t ** 3 * ty;
    min = Math.min(min, Math.hypot(bx - px, by - py));
  }
  return min;
}
