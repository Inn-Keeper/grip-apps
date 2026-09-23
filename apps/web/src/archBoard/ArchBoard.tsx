import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TYPE_COLORS, meta, SCENARIOS, SCENARIO_CATEGORIES, STATEFUL_TYPES, evaluate } from "@grip/core/arch";
import { t } from "@grip/core/i18n";
import { buildPushback } from "@grip/core/pushback";
import { buildGradeFacts } from "@grip/core/talkGrade";
import { emptyTalkTrack, scoreTalkTrack, TALK_TRACK_SECTIONS } from "@grip/core/talkTrack";
import { colors, font } from "@grip/core/tokens";
import { BrandIcon } from "../components/BrandIcon";
import { nodeIconName } from "../components/brandIconNames";
import { Combobox } from "../components/Combobox";
import { HeadlineMetric } from "../components/HeadlineMetric";
import { NextUpLink, NextUpShell } from "../components/NextUpShell";
import { WorkspaceLayout, WorkspacePanel, WorkspaceTitle } from "../components/WorkspaceLayout";
import { workspaceFocusStyle } from "../components/fieldStyles";
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
import { gradeBlockedKey, gradeDetailFor, gradeVerdict, resumeTime } from "./gradeState.js";
import { appendHandoff } from "./scaleHandoff.js";
import { workflowStep } from "./workflowState.js";
import { WorkflowSteps, type RailAction } from "./WorkflowSteps";
import { ROUND_MINUTES } from "@grip/core/designTimer";
import { useDesignRound } from "./useDesignRound";
import styles from "./ArchBoard.module.css";
import {
  useCustomScenariosQuery,
  useDeleteBoardMutation,
  useDeleteScenarioMutation,
  useGradeTalkTrackMutation,
  useGradingStatusQuery,
  useSaveBoardMutation,
  useSavedBoardsQuery,
  useLoadBoard,
  useSaveScenarioMutation,
  talkGradeEnabled,
} from "./queries";
import type { AugmentedScenario, BoardEdge, BoardNode, BoardSummary, ConnectDrag, DragRef, SavedBoard } from "./types";

// Touch-first devices get tap/pinch wording instead of Shift-drag and Ctrl/⌘ + scroll.
const coarsePointer = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

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
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // The whole editor goes fullscreen, palette included: a board you cannot add
  // to is a picture, not a workspace.
  useEffect(() => {
    const sync = () => setIsFullscreen(document.fullscreenElement === editorRef.current);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const canFullscreen = typeof document !== "undefined" && document.fullscreenEnabled;
  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void editorRef.current?.requestFullscreen().catch(() => setIsFullscreen(false));
  };
  // The section the verdict card sends you to; cleared once the cursor lands.
  const [focusSection, setFocusSection] = useState<string | null>(null);
  const nextUpRef = useRef<HTMLDivElement>(null);
  const [nextUpVisible, setNextUpVisible] = useState(true);
  const round = useDesignRound();
  const [timerVisible, setTimerVisible] = useState(true);

  useEffect(() => {
    const node = nextUpRef.current;
    if (!node) return;
    const observer = new IntersectionObserver((entries) => setNextUpVisible(entries[entries.length - 1]?.isIntersecting ?? true), {
      // The sticky rail sits over the top of the page, so a card tucked under
      // it is not really visible.
      rootMargin: "-90px 0px 0px 0px",
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // The clock joins the rail only while its own panel is off screen, so the
  // time is always reachable without being stated twice (rule 6). A callback
  // ref, because the panel mounts and unmounts as the step changes.
  const [ctaVisible, setCtaVisible] = useState(false);
  const ctaObserver = useRef<IntersectionObserver | null>(null);
  // Watches wherever the writing happens: the call to action before the panel
  // is open, the panel itself after. The rail repeats the action only when that
  // place is off screen, which on a sticky desktop rail is rarely, and on a
  // phone is as soon as you scroll.
  const ctaRef = useCallback((node: HTMLDivElement | null) => {
    ctaObserver.current?.disconnect();
    if (!node) {
      setCtaVisible(false);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => setCtaVisible(entries[entries.length - 1]?.isIntersecting ?? false),
      { rootMargin: "-90px 0px 0px 0px" }
    );
    observer.observe(node);
    ctaObserver.current = observer;
  }, []);

  const timerObserver = useRef<IntersectionObserver | null>(null);
  const timerRef = useCallback((node: HTMLDivElement | null) => {
    timerObserver.current?.disconnect();
    if (!node) {
      setTimerVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => setTimerVisible(entries[entries.length - 1]?.isIntersecting ?? true),
      { rootMargin: "-90px 0px 0px 0px" }
    );
    observer.observe(node);
    timerObserver.current = observer;
  }, []);
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
  const activeWorkflowStep = workflowStep(nodes.length, edges.length, result !== null, talkGrade !== null);

  useEffect(() => {
    if (!isDirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    const guardNavigation = (event: Event) => { if (!window.confirm(t("board.discardConfirm"))) event.preventDefault(); };
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

  // Fetched up front: Next Up offers to continue the latest saved board (e.g. the demo sample).
  const { data: savedBoards = [], error: boardsError, isLoading: boardsLoading, refetch: retryBoards } = useSavedBoardsQuery();
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
  // Answered from the service's memory of the last refusal, so asking is free.
  const { data: gradingStatus } = useGradingStatusQuery();
  // The score joins the snapshot, so the board turns dirty and Save persists it.
  const gradeMutation = useGradeTalkTrackMutation((graded) => setTalkGrade(graded.score));

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
  const mayDiscard = () => !isDirty || window.confirm(t("board.discardConfirm"));

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

  const saveBoard = () => {
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
  };
  const evaluateDesign = () => setResult(evaluate(scenario as Parameters<typeof evaluate>[0], nodes, edges));
  // The grader checks the candidate's arithmetic against the design checks, so
  // run evaluate() here rather than making the user press Evaluate design first.
  const gradeTalkTrack = () => {
    if (!activeBoardId) return;
    const checks = result ?? evaluate(scenario as Parameters<typeof evaluate>[0], nodes, edges);
    gradeMutation.mutate({
      boardId: activeBoardId,
      facts: buildGradeFacts(scenario, nodes, checks),
      sections: talkSections,
      selfRating: talkRating,
    });
  };
  // Counts written sections, not "covered" ones: the grader's floor is any text at all.
  const talkWritten = TALK_TRACK_SECTIONS.filter(({ id }) => (talkSections[id] ?? "").trim()).length;
  const limit = gradingStatus?.grading === "unavailable" ? gradingStatus : null;
  const blockedKey = gradeBlockedKey(activeBoardId, talkWritten, Boolean(limit));
  const nodeName = (id: string | null) => meta(nodeById[id ?? ""]?.type ?? "client").label;

  // On an empty, unsaved canvas, the one main action is picking up where you left off.
  const latestBoard = nodes.length === 0 && !activeBoardId && !isDirty ? savedBoards[0] : undefined;
  // Next Up coaches the current workflow step; evaluating is the one main action (rule 1).
  const talkDetail = gradeDetailFor(talkGrade, gradeMutation.data ?? null, activeBoardId);
  // Null on a board loaded from storage: the score persists, the breakdown does not.
  const verdict = gradeVerdict(talkDetail, TALK_TRACK_SECTIONS.map((section) => section.id));
  const weakestLabel = verdict?.weakest
    ? TALK_TRACK_SECTIONS.find((section) => section.id === verdict.weakest.section)?.label ?? ""
    : "";
  const clearFocusSection = useCallback(() => setFocusSection(null), []);
  const answerWeakest = () => {
    setTalkOpen(true);
    if (verdict?.weakest) setFocusSection(verdict.weakest.section);
  };
  // Opening the panel is done after the first press, so every press after it
  // puts the cursor in the next section still to write instead of doing
  // nothing while the button keeps asking to be pressed.
  const writeTalkTrack = () => {
    setTalkOpen(true);
    const unwritten = TALK_TRACK_SECTIONS.find((section) => !(talkSections[section.id] ?? "").trim());
    if (unwritten) setFocusSection(unwritten.id);
  };
  const stepCopy =
    activeWorkflowStep === 1
      ? { title: t("board.stepAddTitle"), sub: t("board.stepAddSub") }
      : activeWorkflowStep === 2
        ? { title: t("board.stepConnectTitle"), sub: connectFrom ? t("board.stepConnectTarget", { name: nodeName(connectFrom) }) : t("board.stepConnectSub") }
        : activeWorkflowStep === 3
          ? { title: t("board.stepDescribeTitle"), sub: t("board.stepDescribeSub") }
          : activeWorkflowStep === 4
            ? { title: t("board.stepExplainTitle"), sub: t("board.stepExplainSub") }
            : {
                title: t("board.stepGradedTitle", { scenario: scenario.name }),
                // The design score stays the screen's one headline in the right
                // rail (rule 17); coverage is stated in words instead (rule 19).
                sub: !verdict
                  ? t("board.stepGradedSub")
                  : verdict.weakest
                    ? t("board.stepGradedDiagnosis", {
                        covered: verdict.covered,
                        total: verdict.total,
                        section: weakestLabel,
                        question: verdict.weakest.gap,
                      })
                    : t("board.stepGradedClear", { total: verdict.total }),
              };
  // Past step 3 the design is scored and the unscored half is the talk track,
  // so the one main action becomes writing it rather than evaluating again.
  const explaining = activeWorkflowStep >= 4;
  // From Explain on, the action belongs beside the sections it opens, so the
  // card and the sticky rail both stand down and it appears exactly once.
  const actionInRightRail = activeWorkflowStep >= 4 && !talkOpen;
  // One definition of the step's main action. The Next Up card renders it, and
  // the sticky rail repeats it only once that card has scrolled away.
  const primaryAction: RailAction = latestBoard
    ? { label: t("board.continueAction"), icon: "story", onClick: () => requestBoard(latestBoard), disabled: false, highlight: true }
    : {
        label: verdict?.weakest
          ? t("board.answerAction")
          : explaining
            ? t("board.explainAction")
            : t("board.evaluateDesign"),
        icon: explaining ? "spark" : "evaluate",
        onClick: verdict?.weakest ? answerWeakest : explaining ? writeTalkTrack : evaluateDesign,
        disabled: nodes.length === 0,
        // The shine asks you to act. Once the panel is open the asking is done,
        // and continuing would be nagging while you type.
        highlight: !(explaining && talkOpen),
      };

  const statusText = saveBoardMutation.isPending ? t("board.statusSaving") : isDirty ? t("board.statusDirty") : activeBoardId ? t("board.saved") : t("board.statusNew");
  const cssVars = {
    ["--arch-border" as string]: colors.borderSoft,
    ["--arch-text-dim" as string]: colors.textDim,
    ["--arch-surface" as string]: colors.surface,
    ["--arch-canvas" as string]: colors.bgDeep,
    // The surround when the editor goes fullscreen, so it is not a black void.
    ["--arch-page" as string]: colors.bg,
    ["--arch-text" as string]: colors.text,
    ["--arch-accent" as string]: colors.accentBright,
  } as React.CSSProperties;
  const overBudget = liveCost > scenario.budget;

  return (
    <WorkspaceLayout
      mainLabel={t("board.title")}
      lockedHint={creatorOpen ? t("board.lockedHint") : null}
      left={
        <>
          {/* Left rail: the scenario you are designing for, and your saved boards (rule 4). */}
          <WorkspacePanel>
            <WorkspaceTitle
              icon={<BrandIcon name={CATEGORY_ICONS[scenario.category ?? ""] ?? "board"} color={colors.accentBright} size={17} />}
              title={t("board.context")}
              subtitle={t("board.scenarioCount", { count: allScenarios.length })}
            />
            <div style={{ marginTop: 12 }}>
              <Combobox value={scenario.id} options={scenarioOptions} onChange={switchScenario} style={{ width: "100%" }} triggerStyle={{ fontWeight: 600 }} />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              <button type="button" className={styles.toolbarButton} onClick={() => setCreatorOpen(true)} style={{ display: "flex", alignItems: "center", gap: 5, color: colors.accentBright }}>
                <BrandIcon name="board" color={colors.accentBright} size={13} />
                {t("board.newScenario")}
              </button>
              {scenario.custom && (
                <button
                  type="button"
                  className={styles.toolbarButton}
                  onClick={() => window.confirm(t("board.deleteScenarioConfirm", { name: scenario.name })) && deleteScenarioMutation.mutate(scenario.id)}
                  style={{ color: colors.dangerBright }}
                >
                  {t("common.delete")}
                </button>
              )}
            </div>
            {deleteScenarioMutation.error && <p role="alert" style={{ margin: "10px 0 0", fontSize: font.size.small, color: colors.dangerBright }}>{t("board.deleteFailed", { message: deleteScenarioMutation.error.message })}</p>}
            {scenariosError && <p role="alert" style={{ margin: "10px 0 0", fontSize: font.size.small, color: colors.dangerBright }}>{t("board.scenariosError")}</p>}
          </WorkspacePanel>

          {scenario.brief && (
            <WorkspacePanel>
              <p style={{ margin: 0, fontSize: font.size.body, lineHeight: 1.6, color: colors.textDim }}>{scenario.brief}</p>
            </WorkspacePanel>
          )}

          <ScaleBrief
            key={scenario.id}
            scenario={scenario}
            onUseInTalkTrack={(text) => {
              // Same commit shape as typing in the section: the grade belongs to
              // the text that earned it, so it clears.
              commit({
                ...snapshot(),
                talkSections: { ...talkSections, scale: appendHandoff(talkSections.scale ?? "", text) },
                talkGrade: null,
              });
              setTalkOpen(true);
              setFocusSection("scale");
            }}
          />

          {/* Saved boards load only once this is opened. */}
          <details className={styles.savedBoards} open={savedOpen} onToggle={(event) => setSavedOpen(event.currentTarget.open)}>
            <summary className={styles.savedSummary}>
              <BrandIcon name="story" color={colors.accentBright} size={16} />
              <span style={{ flex: 1 }}>{t("board.savedBoards")}</span>
              {!boardsLoading && <span style={{ color: colors.textFaint, fontSize: font.size.small }}>{savedBoards.length}</span>}
            </summary>
            <div style={{ padding: "0 14px 14px" }}>
              {boardsLoading ? (
                <p style={{ margin: 0, color: colors.textFaint, fontSize: font.size.small }}>{t("board.boardsLoading")}</p>
              ) : boardsError ? (
                <p role="alert" style={{ margin: 0, color: colors.dangerBright, fontSize: font.size.small }}>
                  {t("board.boardsError", { message: (boardsError as Error).message })}{" "}
                  <button type="button" className={styles.toolbarButton} onClick={() => retryBoards()}>{t("board.retry")}</button>
                </p>
              ) : (
                <SavedBoards activeBoardId={activeBoardId} allScenarios={allScenarios} boards={savedBoards} onDelete={(id) => deleteBoardMutation.mutate(id)} onLoad={requestBoard} />
              )}
              {deleteBoardMutation.error && <p role="alert" style={{ margin: "10px 0 0", fontSize: font.size.small, color: colors.dangerBright }}>{t("board.deleteFailed", { message: deleteBoardMutation.error.message })}</p>}
            </div>
          </details>
        </>
      }
      right={
        <>
          {/* Right rail: the score first, then the round and the budget; inspectors sit beside the canvas (rule 13). */}
          <WorkspacePanel>
            {result ? (
              <HeadlineMetric label={t("board.scoreLabel")} value={result.score} unit="%" pct={result.score} hint={t("board.scoreHint", { earned: result.earned, total: result.totalPts })} />
            ) : (
              <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${colors.borderSoft}` }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                  <span style={{ color: colors.textDim, fontSize: font.size.small, fontWeight: 700 }}>{t("board.scoreLabel")}</span>
                  <span style={{ color: colors.textFaint, fontSize: font.size.hero, fontWeight: 800, lineHeight: 1 }}>—</span>
                </div>
                <p style={{ margin: "8px 0 0", color: colors.textFaint, fontSize: font.size.label }}>{t("board.scoreEmpty")}</p>
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: font.size.small, fontWeight: 600 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6, color: overBudget ? colors.dangerBright : colors.textDim }}>
                <BrandIcon name="cost" color={overBudget ? colors.dangerBright : colors.textDim} size={14} />
                {t("board.costLine", { cost: liveCost, budget: scenario.budget })}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 6, color: colors.textDim }}>
                <BrandIcon name="maintenance" color={colors.textDim} size={14} />
                {t("board.maintLine", { value: liveMaint })}
              </span>
            </div>
          </WorkspacePanel>

          {/* Off by default: most sessions are not timed, and a clock sitting
              in the rail implies you ought to be timing yourself. It is offered
              as one quiet line at the first step, where a 40-minute round still
              has 40 minutes of work ahead of it, and becomes the full panel
              only once someone takes it up. */}
          {round.started ? (
            <div ref={timerRef}>
              <DesignTimer round={round} />
            </div>
          ) : (
            activeWorkflowStep === 1 && (
              <button
                type="button"
                onClick={round.start}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  padding: "10px 14px",
                  background: "transparent",
                  border: `1px dashed ${colors.borderSoft}`,
                  borderRadius: 8,
                  color: colors.textDim,
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <BrandIcon name="spark" color={colors.textFaint} size={14} />
                <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                  <span style={{ fontSize: font.size.small, fontWeight: 700, color: colors.textDim }}>{t("timer.offer")}</span>
                  <span style={{ fontSize: font.size.label, color: colors.textFaint }}>
                    {t("timer.offerHint", { minutes: ROUND_MINUTES })}
                  </span>
                </span>
              </button>
            )
          )}

          {/* Above the sections it opens, where the round used to sit: the button
              and the thing it produces share a place, so pressing it reads as
              the panel arriving rather than something happening elsewhere.
              Inset on every side by the halo's own width. The rail scrolls its
              overflow and this is usually its last child, so without the room
              the ring is cut off at the sides and along the bottom edge. */}
          {actionInRightRail && (
            <div ref={ctaRef} style={{ padding: 8 }}>
              <button
                type="button"
                className={`${styles.railAction} ${styles.railActionShine}`}
                onClick={primaryAction.onClick}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                  width: "100%",
                  padding: "11px 14px",
                  background: colors.accent,
                  border: "none",
                  borderRadius: 8,
                  color: colors.onAccent,
                  fontSize: font.size.body,
                  fontWeight: 800,
                  cursor: "pointer",
                  ["--twinkle-color" as string]: colors.accentBright,
                } as React.CSSProperties}
              >
                <BrandIcon name={primaryAction.icon} color={colors.onAccent} size={14} />
                {primaryAction.label}
              </button>
            </div>
          )}

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
            <NodeInspector node={nodeById[inspectingId]} onChange={(patch) => patchNode(inspectingId, patch)} onClose={() => setInspectingId(null)} />
          )}

          {talkOpen && (
            <div ref={ctaRef}>
            <TalkTrack
              sections={talkSections}
              rating={talkRating}
              grade={talkGrade}
              gradeDetail={talkDetail}
              grading={gradeMutation.isPending}
              gradeError={gradeMutation.error}
              gradeBlocked={blockedKey ? t(blockedKey, limit ? { time: resumeTime(limit.retry_after) } : undefined) : null}
              onGrade={talkGradeEnabled ? gradeTalkTrack : null}
              onChangeSection={(id, value) => {
                commit({ ...snapshot(), talkSections: { ...talkSections, [id]: value }, talkGrade: null });
              }}
              onChangeRating={(value) => {
                commit({ ...snapshot(), talkRating: value, talkGrade: null });
              }}
              focusSection={focusSection}
              onFocused={clearFocusSection}
            />
            </div>
          )}
        </>
      }
    >
      <div style={cssVars}>
        {creatorOpen ? (
          // Creating a scenario is a task: it takes the main column and locks the rails (rules 8, 10).
          <div style={workspaceFocusStyle}>
            <button type="button" onClick={() => setCreatorOpen(false)} style={{ marginBottom: 14, padding: 0, background: "transparent", border: "none", color: colors.accentBright, fontSize: font.size.body, fontWeight: 700, cursor: "pointer" }}>
              {t("board.back")}
            </button>
            <ScenarioForm
              onSave={(form) => saveScenarioMutation.mutate(form)}
              onCancel={() => setCreatorOpen(false)}
              saving={saveScenarioMutation.isPending}
              error={saveScenarioMutation.error}
            />
          </div>
        ) : (
          <>
            {/* Above both branches: the journey must stay on screen even when
                the card is offering to resume an earlier board. */}
            <WorkflowSteps
              activeStep={activeWorkflowStep}
              action={nextUpVisible || ctaVisible ? null : primaryAction}
              round={round.started && !timerVisible ? round : null}
            />
            <div ref={nextUpRef}>
              {latestBoard ? (
                <NextUpShell
                  title={t("board.continueTitle", { title: latestBoard.title })}
                  sub={t("board.continueSub", {
                    scenario: allScenarios.find((item) => item.id === latestBoard.scenarioId)?.name ?? latestBoard.scenarioId,
                    date: new Date(latestBoard.updatedAt).toLocaleDateString(),
                  })}
                  tone={colors.accent ?? ""}
                  actionLabel={primaryAction.label}
                  actionIcon={primaryAction.icon}
                  onAction={primaryAction.onClick}
                />
              ) : (
                <NextUpShell
                  title={stepCopy.title}
                  sub={stepCopy.sub}
                  tone={colors.accent ?? ""}
                  actionLabel={primaryAction.label}
                  actionIcon={primaryAction.icon}
                  onAction={actionInRightRail ? null : primaryAction.onClick}
                  disabled={primaryAction.disabled}
                  links={
                    <>
                      {/* The leading "or" answers a button beside it. With the action in the
                          right rail there is nothing for it to answer. */}
                      <NextUpLink label={t("board.orSave")} onClick={saveBoard} disabled={saveBoardMutation.isPending} withOr={!actionInRightRail} />
                      {explaining && <NextUpLink label={t("board.evaluateDesign")} onClick={evaluateDesign} />}
                    </>
                  }
                />
              )}
            </div>

            {/* Slim toolbar: editing controls for the canvas right under it. */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
              <span aria-live="polite" style={{ fontSize: font.size.small, fontWeight: 600, color: isDirty ? colors.warningBright : colors.successBright, marginRight: 4 }}>
                {statusText}
              </span>
              <button type="button" className={styles.toolbarButton} onClick={() => applyHistory(undo(historyRef.current))} disabled={!historyRef.current.past.length}>{t("board.undo")}</button>
              <button type="button" className={styles.toolbarButton} onClick={() => applyHistory(redo(historyRef.current))} disabled={!historyRef.current.future.length}>{t("board.redo")}</button>
              <button
                type="button"
                className={styles.toolbarButton}
                aria-pressed={talkOpen}
                onClick={() => setTalkOpen((value) => !value)}
                style={{ display: "flex", alignItems: "center", gap: 5, color: talkOpen ? colors.accentBright : undefined, borderColor: talkOpen ? colors.accent : undefined }}
              >
                <BrandIcon name="spark" color={talkOpen ? colors.accentBright : colors.textDim} size={13} />
                {t("talk.title")} ({talkAnswered}/{TALK_TRACK_SECTIONS.length})
              </button>
              <button type="button" className={styles.toolbarButton} onClick={saveBoard} disabled={saveBoardMutation.isPending} aria-busy={saveBoardMutation.isPending} style={{ color: colors.successBright }}>
                {saveBoardMutation.isPending ? t("common.saving") : t("common.save")}
              </button>
              <button type="button" className={styles.toolbarButton} onClick={() => commit({ ...snapshot(), nodes: [], edges: [], talkSections: emptyTalkTrack(), talkRating: null, talkGrade: null })}>
                {t("board.clear")}
              </button>
              {/* Combobox, not a native select: the OS dropdown ignores the app's
                  palette, so this one control rendered light on a dark board. */}
              <div className={styles.connectionRow} style={{ marginLeft: "auto", marginBottom: 0, color: colors.textDim }}>
                <span>{t("board.editArrow")}</span>
                <Combobox
                  value={inspectingEdgeId ?? ""}
                  onChange={(value) => setInspectingEdgeId(value || null)}
                  disabled={edges.length === 0}
                  placeholder={edges.length === 0 ? t("board.edgeNone") : t("board.edgeSelect")}
                  options={[
                    { label: edges.length === 0 ? t("board.edgeNone") : t("board.edgeSelect"), value: "" },
                    ...edges.map((edge) => ({
                      label: `${nodeName(edge.from)} → ${nodeName(edge.to)}${edge.protocol ? ` · ${edge.protocol}` : ""}`,
                      value: edge.id,
                    })),
                  ]}
                  style={{ minWidth: 240 }}
                  triggerStyle={{ minHeight: 32, padding: "5px 9px", fontSize: font.size.small }}
                />
              </div>
            </div>
            {saveBoardMutation.error && (
              <p role="alert" style={{ margin: "0 0 10px", fontSize: font.size.small, color: colors.dangerBright }}>{`${t("board.saveFailedTitle")}: ${saveBoardMutation.error.message}`}</p>
            )}

            <div className={styles.editor} ref={editorRef} data-fullscreen={isFullscreen || undefined}>
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
              position: "relative", minWidth: 0, height: isFullscreen ? "100%" : "calc(100svh - 430px)",
              // Never taller than the screen minus a strip of page: the canvas eats swipes
              // (touch-action: none), so there must always be room outside it to scroll.
              minHeight: isFullscreen ? 0 : "clamp(220px, calc(100svh - 160px), 420px)",
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
                  justifyContent: "center", color: colors.textFaint, fontSize: font.size.body, pointerEvents: "none", padding: "0 24px", textAlign: "center",
                }}
              >
                {t(coarsePointer ? "board.emptyCanvasHintTouch" : "board.emptyCanvasHint")}
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
                        style={{ fontSize: font.size.caption, fontWeight: 600, fill: colors.textFaint, pointerEvents: "none" }}
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
                  aria-label={isSource ? t("board.cancelConnectFrom", { name: spec.label }) : t("board.connectFrom", { name: spec.label })}
                  title={isSource ? t("board.cancelConnect") : t("board.connectTitle")}
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
                  aria-label={t("board.nodeLabel", { name: spec.label })}
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
                    <span style={{ fontSize: font.size.label, fontWeight: 600, color: colors.text, lineHeight: 1.2 }}>{spec.label}</span>
                    {(n.partitionKey?.trim() || n.replicas) && (
                      <span
                        style={{
                          fontSize: font.size.caption,
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
              isFullscreen={isFullscreen}
              onToggleFullscreen={canFullscreen ? toggleFullscreen : null}
            />
          </div>
            </div>

            {result && <EvalResults result={result} scenario={scenario} pushback={buildPushback(scenario, nodes)} showScore={false} />}
          </>
        )}
      </div>
    </WorkspaceLayout>
  );
}
