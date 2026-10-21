// Board edits shared by web and mobile, so both apps follow the same rules
// (no self or duplicate arrows, removing a node takes its arrows with it).
import { CONNECTABLE_FREE_TYPES, isFreeType } from "./arch.js";

/** @typedef {import("./arch.js").BoardNode} BoardNode */
/** @typedef {import("./arch.js").BoardEdge} BoardEdge */
/** @typedef {{ nodes: BoardNode[], edges: BoardEdge[] }} Board */

/** Random id; falls back where crypto.randomUUID is missing (older Hermes). */
export const newId = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

/** `extra` carries type-specific fields, e.g. a free arrow's end point. @param {Board} board @param {string} type @param {{ x: number, y: number }} at @param {Partial<BoardNode>} [extra] @returns {Board} */
export const addNode = (board, type, at, extra = {}) => ({ ...board, nodes: [...board.nodes, { id: newId(), type, x: at.x, y: at.y, ...extra }] });

/** @param {Board} board @param {string} id @returns {Board} */
export const removeNode = (board, id) => ({
  nodes: board.nodes.filter((n) => n.id !== id),
  edges: board.edges.filter((e) => e.from !== id && e.to !== id),
});

/** @param {Board} board @param {string} id @param {Partial<BoardNode>} patch @returns {Board} */
export const patchNode = (board, id, patch) => ({ ...board, nodes: board.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)) });

/** @param {Board} board @param {string} id */
const connectable = (board, id) => {
  const type = board.nodes.find((n) => n.id === id)?.type;
  return !!type && (!isFreeType(type) || CONNECTABLE_FREE_TYPES.includes(type));
};

/** Returns the same board when the arrow would loop, already exists, or touches free text. @param {Board} board @param {string} from @param {string} to @returns {Board} */
export const addEdge = (board, from, to) =>
  from === to || !connectable(board, from) || !connectable(board, to) || board.edges.some((e) => e.from === from && e.to === to)
    ? board
    : { ...board, edges: [...board.edges, { id: newId(), from, to }] };

/** @param {Board} board @param {string} id @returns {Board} */
export const removeEdge = (board, id) => ({ ...board, edges: board.edges.filter((e) => e.id !== id) });

/** @param {Board} board @param {string} id @param {Partial<BoardEdge>} patch @returns {Board} */
export const patchEdge = (board, id, patch) => ({ ...board, edges: board.edges.map((e) => (e.id === id ? { ...e, ...patch } : e)) });
