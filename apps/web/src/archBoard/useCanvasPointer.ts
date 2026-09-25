import type React from "react";
import { useRef, useState } from "react";
import { activateConnection } from "./connectionState.js";
import { NODE_H, NODE_W, WORLD } from "./constants";
import type { BoardNode, ConnectDrag, DragRef } from "./types";

type Options = {
  nodes: BoardNode[];
  setNodes: (nodes: BoardNode[]) => void;
  canvasPoint: (e: React.PointerEvent) => { x: number; y: number } | null;
  addEdge: (from: string, to: string) => void;
  // A finished drag becomes one undo step.
  onMoved: (nodes: BoardNode[]) => void;
};

// Pointer work on the canvas: dragging nodes, Shift-drag or click-click to connect.
// Drag frames are batched per animation frame; only the drop is committed.
export function useCanvasPointer({ nodes, setNodes, canvasPoint, addEdge, onMoved }: Options) {
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [connectDrag, setConnectDrag] = useState<ConnectDrag | null>(null);
  const connectDragRef = useRef<ConnectDrag | null>(null);
  const dragRef = useRef<DragRef | null>(null);
  const suppressClickRef = useRef(false);
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

  const nodeAtPoint = (x: number, y: number, sourceId: string) =>
    nodes.find((node) => {
      if (node.id === sourceId) return false;
      const inBody = x >= node.x && x <= node.x + NODE_W && y >= node.y && y <= node.y + NODE_H;
      const leftAxis = Math.hypot(x - node.x, y - (node.y + NODE_H / 2)) <= 16;
      const rightAxis = Math.hypot(x - (node.x + NODE_W), y - (node.y + NODE_H / 2)) <= 16;
      return inBody || leftAxis || rightAxis;
    });

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
      const target = nodeAtPoint(point.x, point.y, current.from);
      if (target) addEdge(current.from, target.id);
    }
    cancelConnection();
    suppressClickRef.current = true;
  };

  const resetDrag = () => {
    if (dragFrameRef.current !== null) window.cancelAnimationFrame(dragFrameRef.current);
    dragFrameRef.current = null;
    pendingNodesRef.current = null;
    dragRef.current = null;
  };

  const onNodePointerDown = (e: React.PointerEvent, n: BoardNode) => {
    if (e.shiftKey) return startConnection(e, n);
    e.currentTarget.setPointerCapture(e.pointerId);
    const point = canvasPoint(e);
    if (point) dragRef.current = { id: n.id, dx: point.x - n.x, dy: point.y - n.y, moved: false };
  };

  const onNodePointerMove = (e: React.PointerEvent) => {
    if (connectDragRef.current) return moveConnection(e);
    const d = dragRef.current;
    const point = d && canvasPoint(e);
    if (!d || !point) return;
    const x = Math.max(0, Math.min(WORLD.width - NODE_W, point.x - d.dx));
    const y = Math.max(0, Math.min(WORLD.height - NODE_H, point.y - d.dy));
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
      suppressClickRef.current = true;
      const finalNodes = pendingNodesRef.current ?? nodes;
      resetDrag();
      setNodes(finalNodes);
      onMoved(finalNodes);
    }
    resetDrag();
  };

  // Click-click connecting: the first click picks the source, the second draws the arrow.
  const onNodeClick = (n: BoardNode) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
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
