import type React from "react";
import { useRef, useState } from "react";
import { activateConnection } from "./connectionState.js";
import { NODE_H, NODE_W, SNAP_RADIUS, WORLD } from "./constants";
import { nodeSize } from "@grip/core/arch";
import type { BoardNode, ConnectDrag, DragRef } from "./types";

type Options = {
  nodes: BoardNode[];
  setNodes: (nodes: BoardNode[]) => void;
  canvasPoint: (e: React.PointerEvent) => { x: number; y: number } | null;
  addEdge: (from: string, to: string) => void;
  // A finished drag becomes one undo step.
  onMoved: (nodes: BoardNode[]) => void;
};

// Pointer work on the canvas: dragging nodes, dragging from a handle to connect.
// Drag frames are batched per animation frame; only the drop is committed.
export function useCanvasPointer({ nodes, setNodes, canvasPoint, addEdge, onMoved }: Options) {
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [connectDrag, setConnectDrag] = useState<ConnectDrag | null>(null);
  const connectDragRef = useRef<ConnectDrag | null>(null);
  const dragRef = useRef<DragRef | null>(null);
  const dragFrameRef = useRef<number | null>(null);
  const pendingNodesRef = useRef<BoardNode[] | null>(null);

  const setDrag = (next: ConnectDrag | null) => {
    connectDragRef.current = next;
    setConnectDrag(next);
  };

  const cancelConnection = () => {
    setDrag(null);
    setConnectFrom(null);
  };

  const nearestNode = (x: number, y: number, sourceId: string) => {
    let target: BoardNode | null = null;
    let best = SNAP_RADIUS;
    for (const node of nodes) {
      // Free text and free arrows take no graded arrows.
      if (node.id === sourceId || node.type === "text" || node.type === "arrow") continue;
      const { width, height } = nodeSize(node, { width: NODE_W, height: NODE_H });
      const distance = Math.hypot(node.x + width / 2 - x, node.y + height / 2 - y);
      if (distance < best) { best = distance; target = node; }
    }
    return target;
  };

  const startConnection = (e: React.PointerEvent, n: BoardNode) => {
    const point = canvasPoint(e);
    if (!point) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setConnectFrom(n.id);
    setDrag({ from: n.id, x: point.x, y: point.y, moved: false });
  };

  const moveConnection = (e: React.PointerEvent) => {
    const point = canvasPoint(e);
    const current = connectDragRef.current;
    if (point && current) setDrag({ ...current, x: point.x, y: point.y, moved: true });
  };

  const finishConnection = (e: React.PointerEvent) => {
    const current = connectDragRef.current;
    const point = canvasPoint(e);
    if (current && point) {
      const target = nearestNode(point.x, point.y, current.from);
      if (target) addEdge(current.from, target.id);
    }
    cancelConnection();
  };

  const resetDrag = () => {
    if (dragFrameRef.current !== null) window.cancelAnimationFrame(dragFrameRef.current);
    dragFrameRef.current = null;
    pendingNodesRef.current = null;
    dragRef.current = null;
  };

  const onNodePointerDown = (e: React.PointerEvent, n: BoardNode) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const point = canvasPoint(e);
    if (point) dragRef.current = { id: n.id, dx: point.x - n.x, dy: point.y - n.y, moved: false };
  };

  const onNodePointerMove = (e: React.PointerEvent) => {
    if (connectDragRef.current) return moveConnection(e);
    const d = dragRef.current;
    const point = d && canvasPoint(e);
    if (!d || !point) return;
    const dragged = nodes.find((n) => n.id === d.id);
    const { width, height } = dragged ? nodeSize(dragged, { width: NODE_W, height: NODE_H }) : { width: NODE_W, height: NODE_H };
    const x = Math.max(0, Math.min(WORLD.width - width, point.x - d.dx));
    const y = Math.max(0, Math.min(WORLD.height - height, point.y - d.dy));
    d.moved = true;
    pendingNodesRef.current = (pendingNodesRef.current ?? nodes).map((n) => (n.id === d.id ? { ...n, x, y } : n));
    if (dragFrameRef.current === null) dragFrameRef.current = window.requestAnimationFrame(() => {
      if (pendingNodesRef.current) setNodes(pendingNodesRef.current);
      dragFrameRef.current = null;
    });
  };

  const onNodePointerUp = (e: React.PointerEvent) => {
    if (connectDragRef.current) return finishConnection(e);
    if (dragRef.current?.moved) {
      const finalNodes = pendingNodesRef.current ?? nodes;
      resetDrag();
      setNodes(finalNodes);
      onMoved(finalNodes);
    }
    resetDrag();
  };

  // Keyboard connecting: Enter on the source, then Enter on the target.
  const onNodeClick = (n: BoardNode) => {
    const next = activateConnection(connectFrom, n.id);
    if (next.edge) addEdge(next.edge.from, next.edge.to);
    setConnectFrom(next.sourceId);
  };

  return {
    connectFrom,
    connectDrag,
    cancelConnection,
    startConnection,
    // Canvas-level handlers only act while a connection line is being dragged.
    moveConnectionIfActive: (e: React.PointerEvent) => { if (connectDragRef.current) moveConnection(e); },
    finishConnectionIfActive: (e: React.PointerEvent) => { if (connectDragRef.current) finishConnection(e); },
    cancelPointer: () => { resetDrag(); cancelConnection(); },
    onNodePointerDown,
    onNodePointerMove,
    onNodePointerUp,
    onNodeClick,
  };
}
