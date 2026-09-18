import React, { useEffect, useMemo, useRef, useState } from "react";
import { TYPE_COLORS, meta, SCENARIOS, SCENARIO_CATEGORIES, STATEFUL_TYPES, evaluate } from "@grip/core/arch";
import { t } from "@grip/core/i18n";
import { buildPushback } from "@grip/core/pushback";
import { emptyTalkTrack, scoreTalkTrack, TALK_TRACK_SECTIONS } from "@grip/core/talkTrack";
import { colors, layout, shadow } from "@grip/core/tokens";
import { BrandIcon } from "../components/BrandIcon";
import { nodeIconName } from "../components/brandIconNames";
import { Combobox } from "../components/Combobox";
import { CATEGORY_ICONS, CUSTOM_CATEGORY, NODE_H, NODE_W, WORLD } from "./constants";
import { DesignTimer } from "./DesignTimer";
import { EdgeInspector } from "./EdgeInspector";
import { EvalResults } from "./EvalResults";
import { NodeInspector } from "./NodeInspector";
import { NodePalette } from "./NodePalette";
import { SavedBoards } from "./SavedBoards";
import { ScaleBrief } from "./ScaleBrief";
import { ScenarioForm } from "./ScenarioForm";
import { TalkTrack } from "./TalkTrack";
import { activateConnection } from "./connectionState.js";
import { findPlacement } from "./boardGeometry.js";
import { useBoardViewport } from "./useBoardViewport";
import { ViewportControls } from "./ViewportControls";
import { commitSnapshot, createHistory, redo, sameSnapshot, undo } from "./editorState.js";
import { workflowStep } from "./workflowState.js";
import styles from "./ArchBoard.module.css";
import {
  useCustomScenariosQuery,
  useDeleteBoardMutation,
  useDeleteScenarioMutation,
  useSaveBoardMutation,
  useSavedBoardsQuery,
  useLoadBoard,
  useSaveScenarioMutation,
} from "./queries";
import type { AugmentedScenario, BoardEdge, BoardNode, BoardSummary, ConnectDrag, DragRef, SavedBoard } from "./types";

export default function ArchBoard() {
  const [scenarioId, setScenarioId] = useState<string>((SCENARIOS[0] as AugmentedScenario).id);
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [nodes, setNodes] = useState<BoardNode[]>([]);
  const [edges, setEdges] = useState<BoardEdge[]>([]);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [inspectingId, setInspectingId] = useState<string | null>(null);
  const [inspectingEdgeId, setInspectingEdgeId] = useState<string | null>(null);
  const [connectDrag, setConnectDrag] = useState<ConnectDrag | null>(null);
  const [result, setResult] = useState<ReturnType<typeof evaluate> | null>(null);
  const [savedOpen, setSavedOpen] = useState(false);
  const [talkOpen, setTalkOpen] = useState(false);
  const [talkSections, setTalkSections] = useState<Record<string, string>>(emptyTalkTrack);
  const [talkRating, setTalkRating] = useState<number | null>(null);
  const [talkGrade, setTalkGrade] = useState<number | null>(null);
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [activeBoardTitle, setActiveBoardTitle] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragRef | null>(null);
  const connectDragRef = useRef<ConnectDrag | null>(null);
  const suppressClickRef = useRef(false);
  const dragFrameRef = useRef<number | null>(null);
  const pendingNodesRef = useRef<BoardNode[] | null>(null);
  const historyRef = useRef<any>(null);
  const savedSnapshotRef = useRef<any>(null);
  const submittedSnapshotRef = useRef<any>(null);
  const [, renderHistory] = useState(0);
  const nodesRef = useRef<BoardNode[]>([]);
  nodesRef.current = nodes;
  const { view, setView, toBoard, zoomStep, resetZoom, fit, consumePan } = useBoardViewport(canvasRef, nodesRef);

  const { data: customScenarios = [], error: scenariosError } = useCustomScenariosQuery();
  const allScenarios: AugmentedScenario[] = useMemo(() => [
    ...(SCENARIOS as AugmentedScenario[]),
    ...customScenarios.map((s) => ({ ...s, category: CUSTOM_CATEGORY, custom: true })),
  ], [customScenarios]);
  const scenarioOptions = useMemo(() => [...SCENARIO_CATEGORIES, CUSTOM_CATEGORY]
    .map((category) => ({
      label: category,
      options: allScenarios
        .filter((s) => s.category === category)
        .map((s) => ({ value: s.id, label: s.name })),
    }))
    .filter((group) => group.options.length > 0), [allScenarios]);
  const scenario: AugmentedScenario = allScenarios.find((s) => s.id === scenarioId) ?? (SCENARIOS[0] as AugmentedScenario);
  const nodeById = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const snapshot = () => ({ scenarioId, nodes, edges, talkSections, talkRating, talkGrade });
  if (!historyRef.current) {
    historyRef.current = createHistory(snapshot());
    savedSnapshotRef.current = snapshot();
  }
  const isDirty = !sameSnapshot(snapshot(), savedSnapshotRef.current);
  const activeWorkflowStep = workflowStep(nodes.length, edges.length);

  useEffect(() => {
    if (!isDirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    const guardNavigation = (event: Event) => { if (!window.confirm("Discard unsaved changes?")) event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    window.addEventListener("grip:navigate", guardNavigation);
    return () => { window.removeEventListener("beforeunload", warn); window.removeEventListener("grip:navigate", guardNavigation); };
  }, [isDirty]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const editable = event.target instanceof HTMLElement && (event.target.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName));
      if (editable) return;
      if (event.key === "Escape") cancelConnection();
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        applyHistory(event.shiftKey ? redo(historyRef.current) : undo(historyRef.current));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const { data: savedBoards = [], error: boardsError, isLoading: boardsLoading, refetch: retryBoards } = useSavedBoardsQuery(savedOpen);
  const fetchBoard = useLoadBoard();
  const saveBoardMutation = useSaveBoardMutation((board) => {
    setActiveBoardId(board.id ?? null);
    setActiveBoardTitle(board.title);
    savedSnapshotRef.current = submittedSnapshotRef.current;
    renderHistory((value) => value + 1);
  });
  const deleteBoardMutation = useDeleteBoardMutation((id) => {
    if (id === activeBoardId) {
      setActiveBoardId(null);
      setActiveBoardTitle(null);
    }
  });
  const saveScenarioMutation = useSaveScenarioMutation((saved) => {
    setCreatorOpen(false);
    switchScenario(saved.id);
  });
  const deleteScenarioMutation = useDeleteScenarioMutation((id) => {
    if (id === scenarioId) switchScenario((SCENARIOS[0] as AugmentedScenario).id);
  });

  const cancelConnection = () => {
    connectDragRef.current = null;
    setConnectDrag(null);
    setConnectFrom(null);
  };

  const applySnapshot = (value: any) => {
    setScenarioId(value.scenarioId); setNodes(value.nodes); setEdges(value.edges);
    setTalkSections(value.talkSections); setTalkRating(value.talkRating); setTalkGrade(value.talkGrade);
    setResult(null); cancelConnection();
  };
  const applyHistory = (history: any) => {
    historyRef.current = history; applySnapshot(history.present); renderHistory((value) => value + 1);
  };
  const commit = (next: any) => applyHistory(commitSnapshot({ ...historyRef.current, present: snapshot() }, next));
  const mayDiscard = () => !isDirty || window.confirm("Discard unsaved changes?");

  const loadBoard = (board: SavedBoard, discardConfirmed = false) => {
    if (!discardConfirmed && !mayDiscard()) return;
    if (!allScenarios.some((item) => item.id === board.scenarioId)) {
      window.alert(t("board.unknownScenarioMessage", { scenarioId: board.scenarioId }));
      return;
    }
    setScenarioId(board.scenarioId);
    setNodes(board.nodes);
    setEdges(board.edges);
    setTalkSections({ ...emptyTalkTrack(), ...(board.talkTrack?.sections ?? {}) });
    setTalkRating(board.talkTrack?.rating ?? null);
    setTalkGrade(board.talkGrade ?? null);
    cancelConnection();
    setResult(null);
    setActiveBoardId(board.id ?? null);
    setActiveBoardTitle(board.title);
    const loaded = { scenarioId: board.scenarioId, nodes: board.nodes, edges: board.edges,
      talkSections: { ...emptyTalkTrack(), ...(board.talkTrack?.sections ?? {}) },
      talkRating: board.talkTrack?.rating ?? null, talkGrade: board.talkGrade ?? null };
    historyRef.current = createHistory(loaded);
    savedSnapshotRef.current = loaded;
    setSavedOpen(false);
    // Frame the loaded board once the canvas has laid out.
    window.requestAnimationFrame(() => fit(board.nodes));
  };
  const requestBoard = async (summary: BoardSummary) => {
    if (!mayDiscard()) return;
    try { loadBoard(await fetchBoard(summary.id), true); } catch (error) { window.alert((error as Error).message); }
  };
  const liveCost = nodes.reduce((s, n) => s + meta(n.type).cost, 0);
  const liveMaint = nodes.reduce((s, n) => s + meta(n.type).maint, 0);
  const talkAnswered = scoreTalkTrack({ sections: talkSections, rating: talkRating }).answered.length;

  const switchScenario = (id: string) => {
    if (!mayDiscard()) return;
    setScenarioId(id);
    setView({ scale: 1, x: 0, y: 0 });
    setNodes([]);
    setEdges([]);
    setTalkSections(emptyTalkTrack());
    setTalkRating(null);
    setTalkGrade(null);
    cancelConnection();
    setResult(null);
    setActiveBoardId(null);
    setActiveBoardTitle(null);
    const next = { scenarioId: id, nodes: [], edges: [], talkSections: emptyTalkTrack(), talkRating: null, talkGrade: null };
    historyRef.current = createHistory(next); savedSnapshotRef.current = next;
  };

  // New nodes land in the visible part of the board, wherever the user has panned or zoomed.
  const addNode = (type: string) => {
    const origin = { x: Math.max(0, -view.x / view.scale), y: Math.max(0, -view.y / view.scale) };
    const visible = { width: (canvasRef.current?.clientWidth ?? 480) / view.scale, height: (canvasRef.current?.clientHeight ?? 560) / view.scale };
    const shifted = nodes.map((n) => ({ ...n, x: n.x - origin.x, y: n.y - origin.y }));
    const point = findPlacement(shifted, visible, { width: NODE_W, height: NODE_H });
    commit({ ...snapshot(), nodes: [...nodes, { id: crypto.randomUUID(), type, x: point.x + origin.x, y: point.y + origin.y }] });
  };

  const removeNode = (id: string) => {
    commit({ ...snapshot(), nodes: nodes.filter((n) => n.id !== id), edges: edges.filter((e) => e.from !== id && e.to !== id) });
    if (connectFrom === id || connectDrag?.from === id) cancelConnection();
    if (inspectingId === id) setInspectingId(null);
    setResult(null);
  };

  const patchNode = (id: string, patch: Partial<BoardNode>) => {
    commit({ ...snapshot(), nodes: nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)) });
  };

  const addEdge = (from: string, to: string) => {
    if (from === to || edges.some((e) => e.from === from && e.to === to)) return;
    commit({ ...snapshot(), edges: [...edges, { id: crypto.randomUUID(), from, to }] });
  };

  const removeEdge = (id: string) => {
    commit({ ...snapshot(), edges: edges.filter((e) => e.id !== id) });
    if (inspectingEdgeId === id) setInspectingEdgeId(null);
    setResult(null);
  };

  const patchEdge = (id: string, patch: Partial<BoardEdge>) => {
    commit({ ...snapshot(), edges: edges.map((e) => (e.id === id ? { ...e, ...patch } : e)) });
  };

  const canvasPoint = (e: React.PointerEvent) => (canvasRef.current ? toBoard(e.clientX, e.clientY) : null);

  const nodeAtPoint = (x: number, y: number, sourceId: string) =>
    nodes.find((node) => {
      if (node.id === sourceId) return false;
      const inBody = x >= node.x && x <= node.x + NODE_W && y >= node.y && y <= node.y + NODE_H;
      const leftAxis = Math.hypot(x - node.x, y - (node.y + NODE_H / 2)) <= 16;
      const rightAxis = Math.hypot(x - (node.x + NODE_W), y - (node.y + NODE_H / 2)) <= 16;
      return inBody || leftAxis || rightAxis;
    });

  const nodeAxisPoint = (node: BoardNode, target: { x: number } | null = connectDrag) => {
    const targetX = target?.x ?? node.x + NODE_W;
    const useRight = targetX >= node.x + NODE_W / 2;
    return { x: node.x + (useRight ? NODE_W : 0), y: node.y + NODE_H / 2 };
  };

  const startConnectionDrag = (e: React.PointerEvent, n: BoardNode) => {
    const point = canvasPoint(e);
    if (!point) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setConnectFrom(n.id);
    const next = { from: n.id, x: point.x, y: point.y, moved: false };
    connectDragRef.current = next;
    setConnectDrag(next);
  };

  const updateConnectionDrag = (e: React.PointerEvent) => {
    const point = canvasPoint(e);
    if (!point) return;
    const current = connectDragRef.current;
    if (!current) return;
    const next = { ...current, x: point.x, y: point.y, moved: true };
    connectDragRef.current = next;
    setConnectDrag(next);
  };

  const finishConnectionDrag = (e: React.PointerEvent) => {
    const current = connectDragRef.current;
    const point = canvasPoint(e);
    if (current && point) {
      const target = nodeAtPoint(point.x, point.y, current.from);
      if (target) addEdge(current.from, target.id);
    }
    connectDragRef.current = null;
    setConnectDrag(null);
    setConnectFrom(null);
    suppressClickRef.current = true;
  };

  const onNodePointerDown = (e: React.PointerEvent, n: BoardNode) => {
    if (e.shiftKey) {
      startConnectionDrag(e, n);
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    const point = canvasPoint(e);
    if (!point) return;
    dragRef.current = { id: n.id, dx: point.x - n.x, dy: point.y - n.y, moved: false };
  };

  const onNodePointerMove = (e: React.PointerEvent) => {
    if (connectDragRef.current) {
      updateConnectionDrag(e);
      return;
    }
    const d = dragRef.current;
    if (!d) return;
    const point = canvasPoint(e);
    if (!point) return;
    const x = Math.max(0, Math.min(WORLD.width - NODE_W, point.x - d.dx));
    const y = Math.max(0, Math.min(WORLD.height - NODE_H, point.y - d.dy));
    d.moved = true;
    const source = pendingNodesRef.current ?? nodes;
    pendingNodesRef.current = source.map((n) => (n.id === d.id ? { ...n, x, y } : n));
    if (dragFrameRef.current === null) dragFrameRef.current = window.requestAnimationFrame(() => {
      if (pendingNodesRef.current) setNodes(pendingNodesRef.current);
      dragFrameRef.current = null;
    });
  };

  const onNodePointerUp = (e: React.PointerEvent) => {
    if (connectDragRef.current) {
      finishConnectionDrag(e);
      return;
    }
    if (dragRef.current?.moved) {
      suppressClickRef.current = true;
      if (dragFrameRef.current !== null) window.cancelAnimationFrame(dragFrameRef.current);
      const finalNodes = pendingNodesRef.current ?? nodes;
      setNodes(finalNodes);
      historyRef.current = commitSnapshot(historyRef.current, { ...snapshot(), nodes: finalNodes });
      renderHistory((value) => value + 1);
    }
    dragFrameRef.current = null;
    pendingNodesRef.current = null;
    dragRef.current = null;
  };

  const onNodeClick = (n: BoardNode) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    const next = activateConnection(connectFrom, n.id);
    if (next.edge) addEdge(next.edge.from, next.edge.to);
    setConnectFrom(next.sourceId);
  };

  return (
    <main className={styles.page} style={{
      minHeight: `calc(100vh - ${layout.webHeaderHeight}px)`,
      ["--arch-border" as string]: colors.borderSoft,
      ["--arch-text-dim" as string]: colors.textDim,
      ["--arch-surface" as string]: colors.surface,
      ["--arch-canvas" as string]: colors.bgDeep,
      ["--arch-text" as string]: colors.text,
      ["--arch-accent" as string]: colors.accentBright,
    }}>
      <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px", color: colors.textBright }}>
        Arch Board
      </h1>
      <p style={{ margin: "0 0 16px", color: colors.textFaint, fontSize: 13 }}>
        Pick a scenario, click components to add them, then move and connect them on the canvas. Select a node handle
        and a target, or hold Shift and drag between handles.
      </p>

      {/* Scenario picker */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        <BrandIcon name={CATEGORY_ICONS[scenario.category ?? ""] ?? "board"} color={colors.accentBright} size={16} />
        <Combobox
          value={scenario.id}
          options={scenarioOptions}
          onChange={switchScenario}
          style={{ flex: 1, minWidth: 260 }}
          triggerStyle={{ padding: "9px 12px", fontWeight: 600 }}
        />
        <span style={{ fontSize: 11, color: colors.textFaint, fontWeight: 600 }}>
          {allScenarios.length} scenarios
        </span>
        {scenario.custom && (
          <button
            onClick={() => window.confirm(`Delete scenario "${scenario.name}"?`) && deleteScenarioMutation.mutate(scenario.id)}
            style={{
              padding: "7px 14px", background: "transparent", border: `1px solid ${colors.danger}50`,
              borderRadius: 8, color: colors.dangerBright, fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}
          >
            {t("common.delete")}
          </button>
        )}
        <button
          onClick={() => setCreatorOpen((value) => !value)}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "7px 14px", background: "transparent",
            border: `1px solid ${creatorOpen ? colors.accent : `${colors.accent}60`}`,
            borderRadius: 8, color: colors.accentBright, fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}
        >
          <BrandIcon name="board" color={colors.accentBright} size={13} />
          New scenario
        </button>
      </div>

      {creatorOpen && (
        <ScenarioForm
          onSave={(form) => saveScenarioMutation.mutate(form)}
          onCancel={() => setCreatorOpen(false)}
          saving={saveScenarioMutation.isPending}
          error={saveScenarioMutation.error}
        />
      )}

      {scenario.brief && (
        <div
          style={{
            padding: "12px 16px", background: colors.surface, border: `1px solid ${colors.borderSoft}`, boxShadow: shadow.card,
            borderRadius: 10, marginBottom: 14, fontSize: 13, lineHeight: 1.6, color: colors.textDim,
          }}
        >
          {scenario.brief}
        </div>
      )}

      <ScaleBrief key={scenario.id} scenario={scenario} />

      <DesignTimer />

      {/* Live cost ticker + actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 10, flexWrap: "wrap" }}>
        <span aria-live="polite" style={{ fontSize: 12, color: isDirty ? colors.warningBright : colors.successBright }}>
          {saveBoardMutation.isPending ? "Saving…" : isDirty ? "Unsaved changes" : activeBoardId ? "Saved" : "New board"}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: liveCost > scenario.budget ? colors.danger : colors.textDim }}>
          <BrandIcon name="cost" color={liveCost > scenario.budget ? colors.danger : colors.textDim} size={14} />
          Cost {liveCost} / budget {scenario.budget}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: colors.textDim }}>
          <BrandIcon name="maintenance" color={colors.textDim} size={14} />
          Maintenance load {liveMaint}
        </span>
        <div className={styles.actions}>
          <button className={styles.toolbarButton} onClick={() => applyHistory(undo(historyRef.current))} disabled={!historyRef.current.past.length}>Undo</button>
          <button className={styles.toolbarButton} onClick={() => applyHistory(redo(historyRef.current))} disabled={!historyRef.current.future.length}>Redo</button>
          <button
            onClick={() => setTalkOpen((value) => !value)}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "7px 14px", background: "transparent",
              border: `1px solid ${talkOpen ? colors.accent : colors.borderSoft}`,
              borderRadius: 8, color: talkOpen ? colors.accentBright : colors.textDim,
              fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}
          >
            <BrandIcon name="spark" color={talkOpen ? colors.accentBright : colors.textDim} size={13} />
            {t("talk.title")} ({talkAnswered}/{TALK_TRACK_SECTIONS.length})
          </button>
          <button
            onClick={() => setSavedOpen((value) => !value)}
            style={{
              padding: "7px 14px", background: "transparent", border: `1px solid ${savedOpen ? colors.accent : colors.borderSoft}`,
              borderRadius: 8, color: savedOpen ? colors.accentBright : colors.textDim, fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}
          >
            {t("board.saved")}{savedOpen && !boardsLoading ? ` (${savedBoards.length})` : ""}
          </button>
          <button
            onClick={() => {
              submittedSnapshotRef.current = snapshot();
              saveBoardMutation.mutate({
                id: activeBoardId ?? undefined,
                title: activeBoardTitle ?? t("board.draftTitle", { scenario: scenario.name }),
                scenarioId: scenario.id,
                nodes,
                edges,
                talkTrack: { sections: talkSections, rating: talkRating },
                talkGrade,
              });
            }}
            disabled={saveBoardMutation.isPending}
            style={{
              padding: "7px 14px", background: "transparent", border: `1px solid ${colors.success}60`,
              borderRadius: 8, color: colors.successBright, fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}
          >
            {saveBoardMutation.isPending ? t("common.saving") : t("common.save")}
          </button>
          <button
            onClick={() => commit({ ...snapshot(), nodes: [], edges: [], talkSections: emptyTalkTrack(), talkRating: null, talkGrade: null })}
            style={{
              padding: "7px 14px", background: "transparent", border: `1px solid ${colors.borderSoft}`,
              borderRadius: 8, color: colors.textDim, fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}
          >
            Clear board
          </button>
          <button
            onClick={() => setResult(evaluate(scenario as Parameters<typeof evaluate>[0], nodes, edges))}
            disabled={nodes.length === 0}
            style={{
              padding: "7px 16px", background: colors.accent, border: "none", borderRadius: 8,
              color: colors.onAccent, fontSize: 12, fontWeight: 600,
              cursor: nodes.length ? "pointer" : "not-allowed", opacity: nodes.length ? 1 : 0.5,
            }}
          >
            Evaluate design
          </button>
        </div>
      </div>


      {(saveBoardMutation.error || deleteBoardMutation.error || deleteScenarioMutation.error || boardsError) && (
        <p style={{ margin: "0 0 10px", fontSize: 12, color: colors.dangerBright }}>
          {saveBoardMutation.error
            ? `${t("board.saveFailedTitle")}: ${saveBoardMutation.error.message}`
            : deleteBoardMutation.error
              ? `Delete failed: ${deleteBoardMutation.error.message}`
              : deleteScenarioMutation.error
                ? `Delete failed: ${deleteScenarioMutation.error.message}`
                : t("board.boardsError", { message: (boardsError as Error).message })}
        </p>
      )}

      {savedOpen && (
        boardsLoading ? <p style={{ color: colors.textFaint }}>Loading saved boards…</p> : boardsError ?
        <p role="alert" style={{ color: colors.dangerBright }}>Could not load saved boards. <button onClick={() => retryBoards()}>Retry</button></p> : <SavedBoards
          activeBoardId={activeBoardId}
          allScenarios={allScenarios}
          boards={savedBoards}
          onDelete={(id) => deleteBoardMutation.mutate(id)}
          onLoad={requestBoard}
        />
      )}

      <div className={styles.workflow} aria-label="Design workflow">
        <div className={`${styles.workflowStep} ${activeWorkflowStep === 1 ? styles.workflowActive : ""}`}>
          <strong>1. Add components</strong><span>Choose the building blocks from the palette.</span>
        </div>
        <div className={`${styles.workflowStep} ${activeWorkflowStep === 2 ? styles.workflowActive : ""}`}>
          <strong>2. Connect nodes</strong>
          <span aria-live="polite">{connectFrom ? `Now choose a target for ${meta(nodeById[connectFrom]?.type ?? "client").label}, or press Escape.` : "Select a node handle, then choose another node."}</span>
        </div>
        <div className={`${styles.workflowStep} ${activeWorkflowStep === 3 ? styles.workflowActive : ""}`}>
          <strong>3. Describe the arrow</strong><span>Click an arrow or use “Edit arrow” to set its mode and protocol.</span>
        </div>
      </div>
      {scenariosError && <p role="alert" style={{ color: colors.dangerBright }}>Custom scenarios could not be loaded.</p>}
        <label className={styles.connectionRow} style={{ color: colors.textDim }}>
          Edit arrow{" "}
          <select className={styles.connectionSelect} disabled={edges.length === 0} value={inspectingEdgeId ?? ""} onChange={(event) => setInspectingEdgeId(event.target.value || null)}>
            <option value="">{edges.length === 0 ? "Connect two nodes first" : "Select an arrow to edit"}</option>
            {edges.map((edge) => <option key={edge.id} value={edge.id}>{meta(nodeById[edge.from]?.type ?? "client").label} → {meta(nodeById[edge.to]?.type ?? "client").label}{edge.protocol ? ` · ${edge.protocol}` : ""}</option>)}
          </select>
        </label>
      <div className={styles.editor}>
        <NodePalette onAddNode={addNode} />

        {/* Canvas */}
        <div
          ref={canvasRef}
          className={styles.canvas}
          data-board-surface="true"
          tabIndex={0}
          aria-label={t("board.canvasLabel")}
          onPointerMove={(e) => { if (connectDragRef.current) updateConnectionDrag(e); }}
          onPointerUp={(e) => { if (connectDragRef.current) finishConnectionDrag(e); }}
          onPointerCancel={() => {
            if (dragFrameRef.current !== null) window.cancelAnimationFrame(dragFrameRef.current);
            dragFrameRef.current = null; pendingNodesRef.current = null; dragRef.current = null; cancelConnection();
          }}
          onClick={(e) => {
            if (consumePan()) return;
            if ((e.target as HTMLElement).dataset.boardSurface === "true") cancelConnection();
          }}
          style={{
            position: "relative", flex: 1, minWidth: 0, height: "calc(100vh - 360px)", minHeight: 560,
            background: colors.bgDeep,
            // The dot grid belongs to the board, so it pans and scales with it.
            backgroundImage: `radial-gradient(${colors.borderSoft} ${Math.max(0.6, view.scale)}px, transparent ${Math.max(0.6, view.scale)}px)`,
            backgroundSize: `${22 * view.scale}px ${22 * view.scale}px`,
            backgroundPosition: `${view.x}px ${view.y}px`,
            border: `1px solid ${colors.borderSoft}`, borderRadius: 14, overflow: "hidden", touchAction: "none",
          }}
        >
          {nodes.length === 0 && (
            <div
              style={{
                position: "absolute", inset: 0, display: "flex", alignItems: "center",
                justifyContent: "center", color: colors.textFaint, fontSize: 13, pointerEvents: "none",
              }}
            >
              {t("board.emptyCanvasHint")}
            </div>
          )}

          <div
            data-board-surface="true"
            style={{
              position: "absolute", left: 0, top: 0, width: WORLD.width, height: WORLD.height,
              transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`, transformOrigin: "0 0",
            }}
          >

          {/* Edges */}
          <svg style={{ position: "absolute", left: 0, top: 0, width: WORLD.width, height: WORLD.height, pointerEvents: "none" }}>
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill={colors.textDim} />
              </marker>
            </defs>
            {edges.map((e) => {
              const a = nodeById[e.from];
              const b = nodeById[e.to];
              if (!a || !b) return null;
              const sx = a.x + (b.x >= a.x ? NODE_W : 0);
              const sy = a.y + NODE_H / 2;
              const tx = b.x + (b.x >= a.x ? 0 : NODE_W);
              const ty = b.y + NODE_H / 2;
              const mx = (sx + tx) / 2;
              const d = `M ${sx} ${sy} C ${mx} ${sy}, ${mx} ${ty}, ${tx} ${ty}`;
              const selected = inspectingEdgeId === e.id;
              const modeLabel = e.mode === "sync" ? t("edge.sync") : e.mode === "async" ? t("edge.async") : null;
              const label = [e.protocol, modeLabel].filter(Boolean).join(" · ");
              return (
                <g key={e.id}>
                  <path
                    d={d}
                    fill="none"
                    stroke={selected ? colors.accentBright : colors.textDim}
                    strokeWidth={selected ? 3 : 2}
                    // Async hops are dashed — the same visual language a
                    // whiteboard uses for "this one doesn't block".
                    strokeDasharray={e.mode === "async" ? "6 4" : undefined}
                    markerEnd="url(#arrow)"
                  />
                  {label && (
                    <text
                      x={mx}
                      y={(sy + ty) / 2 - 6}
                      textAnchor="middle"
                      style={{ fontSize: 10, fontWeight: 600, fill: colors.textFaint, pointerEvents: "none" }}
                    >
                      {label}
                    </text>
                  )}
                  <path
                    d={d}
                    fill="none"
                    stroke="transparent"
                    strokeWidth="14"
                    style={{ pointerEvents: "stroke", cursor: "pointer" }}
                    onClick={() => setInspectingEdgeId((current) => (current === e.id ? null : e.id))}
                  >
                    <title>{t("edge.clickHint")}</title>
                  </path>
                </g>
              );
            })}
            {connectDrag && (() => {
              const fromNode = nodeById[connectDrag.from];
              if (!fromNode) return null;
              const start = nodeAxisPoint(fromNode, connectDrag);
              const mx = (start.x + connectDrag.x) / 2;
              const d = `M ${start.x} ${start.y} C ${mx} ${start.y}, ${mx} ${connectDrag.y}, ${connectDrag.x} ${connectDrag.y}`;
              return <path d={d} fill="none" stroke={colors.accentBright} strokeWidth="2" strokeDasharray="5 5" markerEnd="url(#arrow)" />;
            })()}
          </svg>

          {/* Nodes */}
          {nodes.map((n) => {
            const spec = meta(n.type);
            const color = TYPE_COLORS[n.type];
            const isSource = connectFrom === n.id;
            const axisHandle = (side: string) => (
              <button
                className={styles.handle}
                onPointerDown={(ev) => {
                  ev.stopPropagation();
                  if (ev.shiftKey) startConnectionDrag(ev, n);
                }}
                onPointerMove={(ev) => {
                  ev.stopPropagation();
                  if (connectDragRef.current) updateConnectionDrag(ev);
                }}
                onPointerUp={(ev) => {
                  ev.stopPropagation();
                  if (connectDragRef.current) finishConnectionDrag(ev);
                }}
                onClick={(ev) => {
                  ev.stopPropagation();
                  if (suppressClickRef.current) {
                    suppressClickRef.current = false;
                    return;
                  }
                  const next = activateConnection(connectFrom, n.id);
                  if (next.edge) addEdge(next.edge.from, next.edge.to);
                  setConnectFrom(next.sourceId);
                }}
                aria-label={isSource ? `Cancel connection from ${spec.label}` : `Connect ${spec.label}`}
                title={isSource ? "Cancel connection" : "Connect from here, or hold Shift and drag to another node axis"}
                style={{
                  position: "absolute",
                  [side]: -16,
                  top: NODE_H / 2 - 16,
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  border: "none",
                  background: "transparent",
                  ["--node-color" as string]: color,
                  cursor: "crosshair",
                  padding: 0,
                }}
              />
            );
            return (
              <div
                key={n.id}
                className={styles.node}
                onPointerDown={(e) => onNodePointerDown(e, n)}
                onPointerMove={onNodePointerMove}
                onPointerUp={onNodePointerUp}
                onClick={() => onNodeClick(n)}
                tabIndex={0}
                role="group"
                aria-label={`${spec.label} node`}
                onKeyDown={(event) => {
                  if (event.key === "Enter") { event.preventDefault(); onNodeClick(n); }
                  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
                    event.preventDefault();
                    const step = event.shiftKey ? 1 : 10;
                    const dx = event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0;
                    const dy = event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0;
                    commit({ ...snapshot(), nodes: nodes.map((node) => node.id === n.id ? { ...node, x: Math.max(0, node.x + dx), y: Math.max(0, node.y + dy) } : node) });
                  }
                  if (event.key === "Delete" || event.key === "Backspace") { event.preventDefault(); removeNode(n.id); }
                }}
                style={{
                  position: "absolute", left: n.x, top: n.y, width: NODE_W, height: NODE_H,
                  boxSizing: "border-box",
                  background: colors.surface,
                  border: `2px solid ${isSource ? colors.textBright : `${color}60`}`,
                  borderRadius: 10, cursor: "grab", touchAction: "none", userSelect: "none",
                  display: "flex", alignItems: "center", gap: 8, padding: "0 10px",
                  boxShadow: isSource ? `0 0 0 3px ${color}30` : "none",
                }}
              >
                <BrandIcon name={nodeIconName(n.type)} color={color} size={18} />
                <span style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: colors.text, lineHeight: 1.2 }}>{spec.label}</span>
                  {(n.partitionKey?.trim() || n.replicas) && (
                    <span
                      style={{
                        fontSize: 9.5,
                        color: colors.textFaint,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {[n.partitionKey?.trim(), n.replicas ? `×${n.replicas}` : null].filter(Boolean).join(" · ")}
                    </span>
                  )}
                </span>
                {STATEFUL_TYPES.includes(n.type) && (
                  <button
                    onPointerDown={(ev) => ev.stopPropagation()}
                    onClick={(ev) => {
                      ev.stopPropagation();
                      setInspectingId((current) => (current === n.id ? null : n.id));
                    }}
                    title={t("node.inspect")}
                    style={{
                      position: "absolute", bottom: -16, right: -16, width: 32, height: 32,
                      borderRadius: "50%", border: "none",
                      background: inspectingId === n.id ? colors.accent : colors.borderSoft,
                      cursor: "pointer", padding: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <BrandIcon
                      name="maintenance"
                      color={inspectingId === n.id ? colors.onAccent : colors.textDim}
                      size={10}
                    />
                  </button>
                )}
                <button
                  onPointerDown={(ev) => ev.stopPropagation()}
                  onClick={(ev) => { ev.stopPropagation(); removeNode(n.id); }}
                  title={t("board.remove")}
                  style={{
                    position: "absolute", top: -16, right: -16, width: 32, height: 32,
                    borderRadius: "50%", border: "none", background: colors.borderSoft,
                    cursor: "pointer", padding: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <BrandIcon name="close" color={colors.textDim} size={10} />
                </button>
                {axisHandle("left")}
                {axisHandle("right")}
              </div>
            );
          })}
          </div>

          <ViewportControls
            scale={view.scale}
            onZoomIn={() => zoomStep(1)}
            onZoomOut={() => zoomStep(-1)}
            onReset={resetZoom}
            onFit={() => fit(nodes)}
          />
        </div>
      </div>

      {inspectingEdgeId && edges.find((e) => e.id === inspectingEdgeId) && (() => {
        const edge = edges.find((e) => e.id === inspectingEdgeId)!;
        return (
          <EdgeInspector
            edge={edge}
            from={nodeById[edge.from]}
            to={nodeById[edge.to]}
            onChange={(patch) => patchEdge(edge.id, patch)}
            onRemove={() => removeEdge(edge.id)}
            onClose={() => setInspectingEdgeId(null)}
          />
        );
      })()}

      {inspectingId && nodeById[inspectingId] && (
        <NodeInspector
          node={nodeById[inspectingId]}
          onChange={(patch) => patchNode(inspectingId, patch)}
          onClose={() => setInspectingId(null)}
        />
      )}

      {talkOpen && (
        <TalkTrack
          sections={talkSections}
          rating={talkRating}
          onChangeSection={(id, value) => {
            commit({ ...snapshot(), talkSections: { ...talkSections, [id]: value }, talkGrade: null });
          }}
          onChangeRating={(value) => {
            commit({ ...snapshot(), talkRating: value, talkGrade: null });
          }}
        />
      )}

      {result && <EvalResults result={result} scenario={scenario} pushback={buildPushback(scenario, nodes)} />}
    </main>
  );
}
