// Where a drag-to-connect line leaves its source: the middle of the side facing the pointer,
// top or bottom when the pointer is more above or below than beside (as the drawn arrow does).
export function nodeAxisPoint(node, target, nodeSize) {
  const cx = node.x + nodeSize.width / 2;
  const cy = node.y + nodeSize.height / 2;
  const dx = (target?.x ?? node.x + nodeSize.width) - cx;
  const dy = (target?.y ?? cy) - cy;
  // Compared against the half sizes, so a wide card still leaves sideways for a pointer off its end.
  if (Math.abs(dy) / nodeSize.height > Math.abs(dx) / nodeSize.width) {
    return { x: cx, y: dy >= 0 ? node.y + nodeSize.height : node.y };
  }
  return { x: dx >= 0 ? node.x + nodeSize.width : node.x, y: cy };
}
