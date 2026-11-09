/** @param {{ height: number, offsetTop: number } | null} viewport
 * @param {number} layoutHeight
 */
export function measureChatViewport(viewport, layoutHeight) {
  return {
    height: viewport?.height ?? layoutHeight,
    bottom: viewport ? Math.max(0, layoutHeight - viewport.height - viewport.offsetTop) : 0,
  };
}
