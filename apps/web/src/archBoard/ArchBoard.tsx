import React, { useCallback, useEffect, useRef, useState } from "react";
import { SHAPE_SIZE, designOnly, findPlacement, nodeSize, isFreeScenario, meta, nodeLabel, SCENARIOS, evaluate, styleOf, type FreeStyle } from "@grip/core/arch";
import * as boardEdits from "@grip/core/boardEdits";
import { getLocale, t } from "@grip/core/i18n";
import { buildPushback } from "@grip/core/pushback";
import { FollowupRound } from "./FollowupRound";
import { SprintLog } from "./SprintLog";
import { buildGradeFacts } from "@grip/core/talkGrade";
import { emptyTalkTrack, scoreTalkTrack, TALK_TRACK_SECTIONS } from "@grip/core/talkTrack";
import { colors, font } from "../lib/tokens";
import { WorkspaceLayout } from "../components/WorkspaceLayout";
import { workspaceFocusStyle } from "../components/fieldStyles";
import { NODE_H, NODE_W, TOOLS_INSET, WORLD } from "./constants";
import { DesignTimer } from "./DesignTimer";
import { EdgeInspector } from "./EdgeInspector";
import { BoardTextNote } from "./BoardTextNote";
import { CanvasTools } from "./CanvasTools";
import { SHAPE_KEYS, TOOL_KEYS, type Shape, type Tool } from "./boardControls";
import { StylePanel } from "./StylePanel";
import { styleShortcut } from "./freeStyle.js";
import { BoardShape } from "./BoardShape";
import { BoardFreeArrows } from "./BoardFreeArrows";
import { DrawLayer } from "./DrawLayer";
import { EvalResults } from "./EvalResults";
import { NodeInspector } from "./NodeInspector";
import { SavedBoardsPanel } from "./SavedBoardsPanel";
import { ScenarioPanel } from "./ScenarioPanel";
import { ScorePanel } from "./ScorePanel";
import { TimerOffer } from "./TimerOffer";
import { ScenarioForm } from "./ScenarioForm";
import { TalkTrack } from "./TalkTrack";
import { useBoardViewport } from "./useBoardViewport";
import { useFullscreen } from "./useFullscreen";
import { useInView } from "./useInView";
import { ViewportControls } from "./ViewportControls";
import { BoardSurface } from "./BoardSurface";
import { BoardNextUp } from "./BoardNextUp";
import { BoardToolbar } from "./BoardToolbar";
import { useCanvasPointer } from "./useCanvasPointer";
import { BoardEdges } from "./BoardEdges";
import { BoardNodeCard } from "./BoardNodeCard";
import { useBoardDocument, type BoardDoc } from "./useBoardDocument";
import { assessmentFor, gradeBlockedKey, gradeInputsKey, gradeStillApplies, gradeVerdict, topologyChanged } from "@grip/core/gradeState";
import { checkTargets, describeProgress, evaluationDelta, nextUndescribedEdge } from "./boardFeedback.js";
import { primaryActionKind } from "./primaryAction.js";
import { boardStepCopy, workflowStep } from "@grip/core/workflowState";
import { WorkflowSteps, type RailAction } from "./WorkflowSteps";
import { useBoardShortcuts } from "./useBoardShortcuts";
import { useDesignRound } from "./useDesignRound";
import { useScenarioCatalog } from "./useScenarioCatalog";
import { clearBoardHandoff, readBoardHandoff } from "../lib/boardHandoff";
import styles from "./ArchBoard.module.css";
import {
  useDeleteBoardMutation,
  useDeleteScenarioMutation,
  useGradeTalkTrackMutation,
  useGradeFollowupsMutation,
  useSprintsQuery,
  useAddSprintMutation,
  useGradingStatusQuery,
  useSaveBoardMutation,
  useSavedBoardsQuery,
  useLoadBoard,
  useSaveScenarioMutation,
  talkGradeEnabled,
} from "./queries";
import type { AugmentedScenario, BoardEdge, BoardNode, BoardSummary, SavedBoard, SprintResult } from "./types";
import { ROUND_MINUTES, formatClock } from "@grip/core/designTimer";
import { ErrorText } from "../components/ErrorText";


export default function ArchBoard() {
  // A story hands over its scenario (new board) or one of its saved boards; cleared once the board mounts.
  const [handoff] = useState(readBoardHandoff);
  useEffect(clearBoardHandoff, []);
  // Setup can land here first (system design goal); say what this board is and where the rest went.
  const [setupNote, setSetupNote] = useState(!!handoff?.fromSetup);
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [inspectingId, setInspectingId] = useState<string | null>(null);
  // The armed tool: Text waits for a click, Arrow and Line for a drag.
  const [tool, setTool] = useState<Tool | null>(null);
  const [arrowDraft, setArrowDraft] = useState<{ x: number; y: number; x2: number; y2: number } | null>(null);
  // The selected node: its resize handles and the style panel follow it.
  // It survives blur so the panel's own buttons work.
  const [styleTargetId, setStyleTargetId] = useState<string | null>(null);
  const [inspectingEdgeId, setInspectingEdgeId] = useState<string | null>(null);
  const [result, setResult] = useState<ReturnType<typeof evaluate> | null>(null);
  // The finished skeleton sprint, until the clock is reset.
  const [sprintResult, setSprintResult] = useState<SprintResult | null>(null);
  const previousEvaluation = useRef<ReturnType<typeof evaluate> | null>(null);
  const [evaluationChange, setEvaluationChange] = useState<ReturnType<typeof evaluationDelta>>(null);
  const [feedbackTarget, setFeedbackTarget] = useState<{ label: string; nodeIds: string[]; edgeIds: string[]; missing: boolean } | null>(null);
  const [savedOpen, setSavedOpen] = useState(false);
  const [talkOpen, setTalkOpen] = useState(false);
  // Bumped by the empty board's "Add component" to open the canvas's Components picker.
  const [componentsRequest, setComponentsRequest] = useState(0);
  const editorRef = useRef<HTMLDivElement>(null);
  // The whole editor goes fullscreen, palette included: a board you cannot add
  // to is a picture, not a workspace.
  const { isFullscreen, canFullscreen, toggleFullscreen } = useFullscreen(editorRef);
  // The section the verdict card sends you to; cleared once the cursor lands.
  const [focusSection, setFocusSection] = useState<string | null>(null);
  const round = useDesignRound();
  // The step's action lives in the sticky rail only. The clock joins the rail
  // only while its own panel is off screen (rule 6).
  const [timerVisible, timerRef] = useInView(true);
  // While a sprint runs the score and checklist stay hidden: recall, not lookup.
  const sprinting = round.sprint && round.started && !sprintResult;
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [activeBoardTitle, setActiveBoardTitle] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const submittedSnapshotRef = useRef<BoardDoc | null>(null);

  // A replaced document (commit, undo, redo) drops a half-drawn arrow, and the topology result only when the diagram changed.
  const board = useBoardDocument(
    () => ({
      scenarioId: handoff?.scenarioId ?? (SCENARIOS[0] as AugmentedScenario).id,
      // The story this board is designed for; part of the saved snapshot like the rest.
      storyId: handoff?.boardId ? null : handoff?.storyId ?? null,
      nodes: [],
      edges: [],
      talkSections: emptyTalkTrack(),
      talkRating: null,
      talkGrade: null,
      brief: "",
      talkAssessment: null,
    }),
    (prev, next) => { if (topologyChanged(prev, next)) { setResult(null); setFeedbackTarget(null); } cancelConnection(); },
  );
  const { doc, commit, isDirty } = board;
  const { scenarioId, storyId, nodes, edges, talkSections, talkRating, talkGrade, brief } = doc;
  // A free board has no checklist: no steps, no Evaluate, no design score.
  const free = isFreeScenario(scenarioId);

  const boardPoint = (e: React.PointerEvent) => (canvasRef.current ? toBoard(e.clientX, e.clientY) : null);
  const nodesRef = useRef<BoardNode[]>([]);
  nodesRef.current = nodes;
  const { view, setView, toBoard, zoomStep, resetZoom, fit, consumePan } = useBoardViewport(canvasRef, nodesRef);
  const pointer = useCanvasPointer({
    nodes,
    setNodes: board.setNodes,
    canvasPoint: (e) => boardPoint(e),
    addEdge: (from, to) => addEdge(from, to),
    onMoved: board.recordNodes,
  });
  const { connectFrom, connectDrag, cancelConnection } = pointer;
  // Entering or leaving full screen resizes the canvas; frame the board for the new size.
  const wasFullscreen = useRef(isFullscreen);
  useEffect(() => {
    if (wasFullscreen.current === isFullscreen) return;
    wasFullscreen.current = isFullscreen;
    const frame = window.requestAnimationFrame(() => fit(nodesRef.current));
    return () => window.cancelAnimationFrame(frame);
  }, [isFullscreen, fit]);

  const { allScenarios, scenarioOptions, error: scenariosError, isFetching: scenariosFetching } = useScenarioCatalog();
  const scenario: AugmentedScenario = allScenarios.find((s) => s.id === scenarioId) ?? (SCENARIOS[0] as AugmentedScenario);
  const nodeById = Object.fromEntries(nodes.map((n) => [n.id, n]));
  // Free boxes and text are notes, so they don't move the journey forward.
  const design = designOnly(nodes, edges);
  const talkDetail = assessmentFor(doc, activeBoardId);
  const activeWorkflowStep = workflowStep(design.nodes.length, design.edges.length, result !== null, talkDetail !== null);

  const toggleTool = (name: Tool) => setTool((current) => (current === name ? null : name));
  useBoardShortcuts(
    board,
    isDirty,
    () => { cancelConnection(); setTool(null); setStyleTargetId(null); },
    (key) => {
      if (SHAPE_KEYS[key]) addShape(SHAPE_KEYS[key]);
      else if (TOOL_KEYS[key]) toggleTool(TOOL_KEYS[key]);
    },
  );

  // Fetched up front: Next Up offers to continue the latest saved board (e.g. the demo sample).
  const { data: savedBoards = [], error: boardsError, isLoading: boardsLoading, refetch: retryBoards } = useSavedBoardsQuery();
  const fetchBoard = useLoadBoard();
  const saveBoardMutation = useSaveBoardMutation((saved) => {
    setActiveBoardId(saved.id ?? null);
    setActiveBoardTitle(saved.title);
    if (submittedSnapshotRef.current) board.markSaved(submittedSnapshotRef.current);
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
  // A late answer applies only to the board and inputs it was asked about.
  const submittedGradeRef = useRef<{ boardId: string; inputs: string } | null>(null);
  const liveRef = useRef({ doc, boardId: activeBoardId });
  liveRef.current = { doc, boardId: activeBoardId };
  const gradeMutation = useGradeTalkTrackMutation((graded) => {
    if (gradeStillApplies(submittedGradeRef.current, liveRef.current.boardId, liveRef.current.doc)) board.setAssessment(graded);
  });
  const { data: sprints = [] } = useSprintsQuery();
  const addSprintMutation = useAddSprintMutation();
  const submittedFollowupsRef = useRef<{ boardId: string; inputs: string } | null>(null);
  const followupMutation = useGradeFollowupsMutation((round) => {
    if (gradeStillApplies(submittedFollowupsRef.current, liveRef.current.boardId, liveRef.current.doc)) board.setFollowups(round);
  });

  const mayDiscard = () => !isDirty || window.confirm(t("board.discardConfirm"));
  // Replaces the whole document (load or new scenario) and clears everything derived from it.
  const startDocument = (next: BoardDoc, active: { id: string | null; title: string | null }) => {
    board.reset(next);
    cancelConnection();
    setResult(null);
    previousEvaluation.current = null;
    setEvaluationChange(null);
    setFeedbackTarget(null);
    setInspectingEdgeId(null);
    setInspectingId(null);
    setStyleTargetId(null);
    setActiveBoardId(active.id);
    setActiveBoardTitle(active.title);
  };

  const loadBoard = (saved: SavedBoard, discardConfirmed = false) => {
    if (!discardConfirmed && !mayDiscard()) return;
    if (!allScenarios.some((item) => item.id === saved.scenarioId)) {
      window.alert(t("board.unknownScenarioMessage", { scenarioId: saved.scenarioId }));
      return;
    }
    startDocument(
      {
        scenarioId: saved.scenarioId,
        storyId: saved.storyId ?? null,
        nodes: saved.nodes,
        edges: saved.edges,
        talkSections: { ...emptyTalkTrack(), ...(saved.talkTrack?.sections ?? {}) },
        talkRating: saved.talkTrack?.rating ?? null,
        talkGrade: saved.talkGrade ?? null,
        brief: saved.brief ?? "",
        talkAssessment: saved.talkAssessment ?? null,
      },
      { id: saved.id ?? null, title: saved.title },
    );
    setSavedOpen(false);
    // Frame the loaded board once the canvas has laid out.
    window.requestAnimationFrame(() => fit(saved.nodes));
  };
  const requestBoard = async (summary: BoardSummary) => {
    if (!mayDiscard()) return;
    try { loadBoard(await fetchBoard(summary.id), true); } catch (error) { window.alert((error as Error).message); }
  };
  // A saved board handed over from a story loads once the custom scenarios are in, since
  // loadBoard refuses a scenario it can't find. Refs keep the effect to that one trigger.
  const pendingBoardRef = useRef(handoff?.boardId ?? null);
  const loadHandedBoardRef = useRef<(id: string) => void>(() => {});
  loadHandedBoardRef.current = (id) => fetchBoard(id).then((saved) => loadBoard(saved, true), (error) => window.alert((error as Error).message));
  useEffect(() => {
    const id = pendingBoardRef.current;
    if (!id || scenariosFetching) return;
    pendingBoardRef.current = null;
    loadHandedBoardRef.current(id);
  }, [scenariosFetching]);
  const talkAnswered = scoreTalkTrack({ sections: talkSections, rating: talkRating }).answered.length;

  const switchScenario = (id: string) => {
    if (!mayDiscard()) return;
    setView({ scale: 1, x: 0, y: 0 });
    startDocument(
      { scenarioId: id, storyId: null, nodes: [], edges: [], talkSections: emptyTalkTrack(), talkRating: null, talkGrade: null, brief: "", talkAssessment: null },
      { id: null, title: null },
    );
  };

  // New nodes land in the visible part of the board, wherever the user has panned or zoomed.
  const placeNode = (type: string, size: { width: number; height: number }, extra?: Partial<BoardNode>) => {
    // Below the floating tools, so a new node never lands under them.
    const origin = { x: Math.max(0, -view.x / view.scale), y: Math.max(0, (TOOLS_INSET - view.y) / view.scale) };
    const visible = { width: (canvasRef.current?.clientWidth ?? 480) / view.scale, height: ((canvasRef.current?.clientHeight ?? 560) - TOOLS_INSET) / view.scale };
    const shifted = nodes.map((n) => ({ ...n, x: n.x - origin.x, y: n.y - origin.y }));
    const point = findPlacement(shifted, visible, size, (n: BoardNode) => nodeSize(n, { width: NODE_W, height: NODE_H }));
    const next = boardEdits.addNode({ nodes, edges }, type, { x: point.x + origin.x, y: point.y + origin.y }, extra);
    edit(next);
    return next.nodes[next.nodes.length - 1]!.id;
  };
  const addNode = (type: string) => { placeNode(type, { width: NODE_W, height: NODE_H }); };
  // A new shape is selected, so its resize handles and the style panel show at once.
  const addShape = (shape: Shape) => {
    const { w, h } = SHAPE_SIZE[shape];
    setStyleTargetId(placeNode("box", { width: w, height: h }, { shape, w, h }));
  };
  // A line is an arrow without heads; the draw tools are one-shot, like Text.
  const addArrow = (points: { x: number; y: number; x2: number; y2: number }) => {
    const next = boardEdits.addNode({ nodes, edges }, "arrow", { x: points.x, y: points.y }, { x2: points.x2, y2: points.y2, ...(tool === "line" ? { style: { heads: "none" as const } } : {}) });
    edit(next);
    setStyleTargetId(next.nodes[next.nodes.length - 1]!.id);
    setTool(null);
  };

  const styleTarget = nodes.find((n) => n.id === styleTargetId) ?? null;
  const setStyle = (patch: FreeStyle) => styleTarget && patchNode(styleTarget.id, { style: { ...styleTarget.style, ...patch } });
  // Style shortcuts work while the target is focused or being typed in, so they run in the capture phase.
  const onStyleShortcut = (event: React.KeyboardEvent) => {
    if (!styleTarget || styleTarget.type === "arrow") return;
    const patch = styleShortcut(event, styleOf(styleTarget));
    if (!patch) return;
    event.preventDefault();
    event.stopPropagation();
    if (Object.keys(patch).length) setStyle(patch);
  };

  // Text lands where the user clicked, with the caret roughly on the click; the tool is one-shot.
  const addText = (clientX: number, clientY: number) => {
    const point = toBoard(clientX, clientY);
    edit(boardEdits.addNode({ nodes, edges }, "text", { x: Math.max(0, point.x - 6), y: Math.max(0, point.y - 14) }));
    setTool(null);
  };

  // Structural edits follow core's rules; a commit also clears the score (applySnapshot).
  const edit = (next: { nodes: BoardNode[]; edges: BoardEdge[] }) => {
    if (next.nodes !== nodes || next.edges !== edges) commit(next);
  };

  const removeNode = (id: string) => {
    edit(boardEdits.removeNode({ nodes, edges }, id));
    if (connectFrom === id || connectDrag?.from === id) cancelConnection();
    if (inspectingId === id) setInspectingId(null);
    if (styleTargetId === id) setStyleTargetId(null);
  };
  const patchNode = (id: string, patch: Partial<BoardNode>) => edit(boardEdits.patchNode({ nodes, edges }, id, patch));
  const addEdge = (from: string, to: string) => edit(boardEdits.addEdge({ nodes, edges }, from, to));
  const removeEdge = (id: string) => {
    edit(boardEdits.removeEdge({ nodes, edges }, id));
    if (inspectingEdgeId === id) setInspectingEdgeId(null);
  };
  const patchEdge = (id: string, patch: Partial<BoardEdge>) => edit(boardEdits.patchEdge({ nodes, edges }, id, patch));


  const saveBoard = () => {
    submittedSnapshotRef.current = doc;
    saveBoardMutation.mutate({
      id: activeBoardId ?? undefined,
      title: activeBoardTitle ?? t("board.draftTitle", { scenario: scenario.name }),
      scenarioId: scenario.id,
      storyId,
      nodes,
      edges,
      talkTrack: { sections: talkSections, rating: talkRating },
      talkGrade,
      talkAssessment: doc.talkAssessment,
      brief,
    });
  };
  const evaluateDesign = () => {
    const next = evaluate(scenario as Parameters<typeof evaluate>[0], nodes, edges);
    setEvaluationChange(evaluationDelta(previousEvaluation.current, next));
    previousEvaluation.current = next;
    setFeedbackTarget(null);
    setResult(next);
    return next;
  };
  // A sprint ends by evaluating: the clock stops and the checks are revealed.
  const finishSprint = (ranOut: boolean) => {
    round.pause();
    const next = evaluateDesign();
    const missed = next.checks.filter((check) => !check.passed).map((check) => check.label);
    const sprint = { seconds: Math.min(Math.round(round.elapsedMs / 1000), round.minutes * 60), ranOut, hit: next.checks.length - missed.length, total: next.checks.length, missed };
    setSprintResult(sprint);
    addSprintMutation.mutate({ ...sprint, scenarioId });
  };
  const evaluateOrFinish = () => { if (sprinting) finishSprint(false); else evaluateDesign(); };
  // Ten minutes is the whole point: at zero the sprint ends as it stands.
  const sprintTimedOut = sprinting && round.running && round.overrun;
  useEffect(() => {
    if (sprintTimedOut) finishSprint(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sprintTimedOut]);
  // Resetting the clock clears the finished sprint with it.
  useEffect(() => {
    if (!round.started) setSprintResult(null);
  }, [round.started]);
  const inspectEdge = (id: string) => {
    const edge = edges.find((item) => item.id === id);
    if (!edge) return;
    setFeedbackTarget(null);
    cancelConnection();
    setArrowDraft(null);
    setInspectingId(null);
    setInspectingEdgeId(id);
    setTool(null);
    fit(nodes.filter((node) => node.id === edge.from || node.id === edge.to));
    canvasRef.current?.scrollIntoView({ behavior: "auto", block: "center" });
  };
  const inspectCheck = (check: ReturnType<typeof evaluate>["checks"][number]) => {
    cancelConnection();
    setTool(null);
    setArrowDraft(null);
    const target = checkTargets(check, nodes, edges);
    setFeedbackTarget({ ...target, label: check.label });
    setInspectingEdgeId(null);
    setInspectingId(null);
    if (target.nodeIds.length) fit(nodes.filter((node) => target.nodeIds.includes(node.id)));
    if (check.kind === "prop" && target.nodeIds[0]) setInspectingId(target.nodeIds[0]);
    else if (target.edgeIds[0]) setInspectingEdgeId(target.edgeIds[0]);
    if (target.missing) setComponentsRequest((value) => value + 1);
    editorRef.current?.scrollIntoView({ behavior: "auto", block: "start" });
    canvasRef.current?.focus({ preventScroll: true });
    // Flips between two identical animations so locating the same check again replays the pulse.
    if (canvasRef.current) canvasRef.current.dataset.locate = canvasRef.current.dataset.locate === "a" ? "b" : "a";
  };
  // The grader checks the candidate's arithmetic against the design checks, so
  // run evaluate() here rather than making the user press Evaluate design first.
  const gradeTalkTrack = () => {
    if (!activeBoardId) return;
    const checks = result ?? evaluate(scenario as Parameters<typeof evaluate>[0], nodes, edges);
    submittedGradeRef.current = { boardId: activeBoardId, inputs: gradeInputsKey(doc) };
    gradeMutation.mutate({
      boardId: activeBoardId,
      // A free board is graded against the brief the user wrote.
      facts: buildGradeFacts(free ? { ...scenario, brief: brief.trim() } : scenario, nodes, checks),
      sections: talkSections,
      selfRating: talkRating,
    });
  };
  const gradeFollowups = (followups: { question: string; answer: string }[]) => {
    if (!activeBoardId) return;
    const checks = result ?? evaluate(scenario as Parameters<typeof evaluate>[0], nodes, edges);
    submittedFollowupsRef.current = { boardId: activeBoardId, inputs: gradeInputsKey(doc) };
    followupMutation.mutate({
      boardId: activeBoardId,
      facts: buildGradeFacts(free ? { ...scenario, brief: brief.trim() } : scenario, nodes, checks),
      followups,
    });
  };
  // Counts written sections, not "covered" ones: the grader's floor is any text at all.
  const talkWritten = TALK_TRACK_SECTIONS.filter(({ id }) => (talkSections[id] ?? "").trim()).length;
  const limit = gradingStatus?.grading === "unavailable" ? gradingStatus : null;
  // Durations are rounded to seconds; never advertise an earlier minute than the reset.
  const gradingResumeAt = limit?.retryAt ? Math.ceil(limit.retryAt / 60_000) * 60_000 : null;
  // The grader needs a brief; on a free board that is the user's own.
  const blockedKey = free && !brief.trim() ? "board.gradeNeedsBrief" : gradeBlockedKey(activeBoardId, talkWritten, Boolean(limit));
  const nodeName = (id: string | null) => { const node = nodeById[id ?? ""]; return node ? nodeLabel(node) : meta("client").label; };

  // On an empty, unsaved canvas, the one main action is picking up where you left off.
  const latestBoard = nodes.length === 0 && !activeBoardId && !isDirty ? savedBoards[0] : undefined;
  // Next Up coaches the current workflow step; evaluating is the one main action (rule 1).
  // Only a validated assessment can describe the reasoning on this board.
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
  const pendingDescription = nextUndescribedEdge(design.edges) as BoardEdge | null;
  const baseStepCopy = boardStepCopy({
    step: activeWorkflowStep,
    connectFromName: connectFrom ? nodeName(connectFrom) : null,
    scenarioName: scenario.name,
    verdict,
    weakestLabel,
  });
  const stepCopy = activeWorkflowStep === 3
    ? pendingDescription
      ? { title: t("board.describeArrow", { from: nodeName(pendingDescription.from), to: nodeName(pendingDescription.to) }), sub: t(!pendingDescription.mode && !pendingDescription.protocol ? "board.arrowNeedsBoth" : !pendingDescription.mode ? "board.arrowNeedsMode" : "board.arrowNeedsProtocol") }
      : { title: t("board.connectionsReady"), sub: t("board.connectionsReadyHint") }
    : baseStepCopy;
  // Past step 3 the design is scored and the unscored half is the talk track,
  // so the one main action becomes writing it rather than evaluating again.
  const explaining = activeWorkflowStep >= 4;
  // One definition of the step's main action, rendered once, in the sticky rail.
  const kind = primaryActionKind({ hasLatestBoard: Boolean(latestBoard), hasUndescribed: Boolean(pendingDescription), hasWeakest: Boolean(verdict?.weakest), explaining, empty: design.nodes.length === 0, free });
  const primaryAction: RailAction =
    kind === "continue" && latestBoard
      ? { label: t("board.continueAction"), icon: "story", onClick: () => requestBoard(latestBoard), disabled: false, highlight: true }
      : kind === "add"
      ? { label: t("board.addComponentAction"), icon: "layers", onClick: () => setComponentsRequest((n) => n + 1), disabled: false, highlight: true }
      : kind === "describe" && pendingDescription
      // Its editor is already open: the asking is done, so the button stands down.
      ? { label: t("board.describeAction", describeProgress(design.edges)), icon: "board", onClick: () => inspectEdge(pendingDescription.id), disabled: inspectingEdgeId === pendingDescription.id, highlight: inspectingEdgeId !== pendingDescription.id }
      : {
          label: t(kind === "answer" ? "board.answerAction" : kind === "explain" ? "board.explainAction" : "board.evaluateDesign"),
          icon: explaining ? "spark" : "evaluate",
          onClick: kind === "answer" ? answerWeakest : kind === "explain" ? writeTalkTrack : evaluateOrFinish,
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
    ["--arch-danger" as string]: colors.dangerBright,
  } as React.CSSProperties;

  return (
    <WorkspaceLayout
      mainLabel={t("board.title")}
      fullWidth
      leftFirstOnPhone
      lockedHint={creatorOpen ? t("board.lockedHint") : null}
      left={
        <>
          <ScenarioPanel
            scenario={scenario}
            // The free board is not a scenario, so it stays out of the count.
            scenarioCount={allScenarios.length - 1}
            scenarioOptions={scenarioOptions}
            onSwitch={switchScenario}
            board={{ id: activeBoardId, storyId, onStoryChange: (id) => commit({ storyId: id }) }}
            freeBrief={free ? { value: brief, onChange: (value) => commit({ brief: value }) } : null}
            onNewScenario={() => setCreatorOpen(true)}
            onDeleteScenario={() => window.confirm(t("board.deleteScenarioConfirm", { name: scenario.name })) && deleteScenarioMutation.mutate(scenario.id)}
            errors={[
              deleteScenarioMutation.error ? t("board.deleteFailed", { message: deleteScenarioMutation.error.message }) : null,
              scenariosError ? t("board.scenariosError") : null,
            ]}
          />

          <SavedBoardsPanel
            open={savedOpen}
            onToggle={setSavedOpen}
            boards={savedBoards}
            loading={boardsLoading}
            error={boardsError as Error | null}
            onRetry={() => retryBoards()}
            activeBoardId={activeBoardId}
            allScenarios={allScenarios}
            onLoad={requestBoard}
            onDelete={(id) => deleteBoardMutation.mutate(id)}
            deleteError={deleteBoardMutation.error}
          />
        </>
      }
      right={
        <>
          {/* Right rail: the score first, then the round; inspectors sit beside the canvas (rule 13). */}
          {!free && !sprinting && <ScorePanel result={result} reasoning={talkDetail ? talkGrade : null} written={talkAnswered} />}

          {round.started ? (
            <div ref={timerRef}>
              <DesignTimer
                round={round}
                onFinishSprint={() => finishSprint(false)}
                summary={sprintResult && t(sprintResult.ranOut ? "sprint.ranOut" : "sprint.done", { time: formatClock(sprintResult.seconds * 1000), hit: sprintResult.hit, total: sprintResult.total })}
              />
            </div>
          ) : (
            activeWorkflowStep === 1 && (
              <>
                <TimerOffer title={t("timer.offer")} hint={t("timer.offerHint", { minutes: ROUND_MINUTES })} onStart={round.start} />
                <TimerOffer title={t("sprint.offer")} hint={t("sprint.offerHint")} onStart={round.startSprint} />
              </>
            )
          )}
          {/* The trend belongs where a sprint starts and where one just ended. */}
          {!free && (round.sprint || activeWorkflowStep === 1) && (
            <SprintLog sprints={sprints} saveError={addSprintMutation.error} />
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
            <div>
            <TalkTrack
              sections={talkSections}
              rating={talkRating}
              grade={talkGrade}
              gradeDetail={talkDetail}
              grading={gradeMutation.isPending}
              gradeError={gradeMutation.error}
              gradeBlocked={blockedKey === "talk.gradeLimited"
                ? t(limit?.retryAt ? (limit.code === "provider_quota_exhausted" ? "talk.gradeLimited" : "talk.gradeRateLimited") : "talk.gradeUnavailable", { time: limit?.retryAt ? new Date(gradingResumeAt!).toLocaleString(getLocale(), { dateStyle: "medium", timeStyle: "short" }) : "" })
                : blockedKey ? t(blockedKey) : null}
              onGrade={talkGradeEnabled ? gradeTalkTrack : null}
              onChangeSection={(id, value) => {
                commit({ talkSections: { ...talkSections, [id]: value } });
              }}
              onChangeRating={(value) => {
                commit({ talkRating: value });
              }}
              focusSection={focusSection}
              onFocused={clearFocusSection}
              free={free}
            />
            {/* Offered once the reasoning is graded: its hardest follow-up, then the board's own. */}
            {talkDetail && talkGradeEnabled && (
              <FollowupRound
                key={`${activeBoardId}:${gradeInputsKey(doc)}`}
                questions={[...new Set([talkDetail.suggestion.hardest_followup, ...buildPushback(scenario, nodes)])].slice(0, 6)}
                saved={doc.talkAssessment?.followups}
                grading={followupMutation.isPending}
                error={followupMutation.error}
                onGrade={gradeFollowups}
              />
            )}
            </div>
          )}
        </>
      }
    >
      <div style={cssVars}>
        {setupNote && !creatorOpen && (
          <p role="status" className={styles.setupNote}>
            {t("board.setupNote")}
            <button type="button" className={styles.setupNoteClose} onClick={() => setSetupNote(false)} aria-label={t("board.setupNoteDismiss")}>
              ×
            </button>
          </p>
        )}
        {creatorOpen ? (
          // Creating a scenario is a task: it takes the main column and locks the rails (rules 8, 10).
          <div style={workspaceFocusStyle}>
            <button type="button" onClick={() => setCreatorOpen(false)} style={{
                marginBottom: 14,
                padding: 0,
                background: "transparent",
                border: "none",
                color: colors.accentBright,
                fontSize: font.size.body,
                fontWeight: 700,
                cursor: "pointer"
              }}>
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
            {!free && (
            <>
            <WorkflowSteps
              activeStep={activeWorkflowStep}
              action={primaryAction}
              round={round.started && !timerVisible ? round : null}
            />
            <div>
              <BoardNextUp
                latestBoard={latestBoard}
                allScenarios={allScenarios}
                stepCopy={stepCopy}
                explaining={explaining}
                offerEvaluation={activeWorkflowStep === 3 && Boolean(pendingDescription)}
                onEvaluate={evaluateOrFinish}
              />
            </div>
            </>
            )}

            <BoardToolbar
              status={{ text: statusText, dirty: isDirty, saved: Boolean(activeBoardId) && !isDirty && !saveBoardMutation.isPending }}
              history={{
                canUndo: board.canUndo,
                canRedo: board.canRedo,
                onUndo: board.undo,
                onRedo: board.redo,
              }}
              talk={{ open: talkOpen, answered: talkAnswered, onToggle: () => setTalkOpen((value) => !value) }}
              save={{ pending: saveBoardMutation.isPending, onSave: saveBoard }}
              onClear={() => commit({ nodes: [], edges: [], talkSections: emptyTalkTrack(), talkRating: null })}
              arrows={{
                options: edges.map((edge) => ({
                  label: `${nodeName(edge.from)} → ${nodeName(edge.to)}${edge.protocol ? ` · ${edge.protocol === "Unspecified" ? t("edge.unspecified") : edge.protocol}` : ""}`,
                  value: edge.id,
                })),
                selectedId: inspectingEdgeId,
                onSelect: (id) => id ? inspectEdge(id) : setInspectingEdgeId(null),
              }}
            />
            {/* The one-board-per-story index gets words of its own; the story picker normally prevents it. */}
            {saveBoardMutation.error && (
              <ErrorText margin="0 0 10px">
                {saveBoardMutation.error.message.includes("arch_boards_one_per_story")
                  ? t("board.storyTakenError")
                  : `${t("board.saveFailedTitle")}: ${saveBoardMutation.error.message}`}</ErrorText>
            )}

            {feedbackTarget && <div role="status" className={styles.feedbackFocus}>
              <div><strong>{feedbackTarget.label}</strong><p>{t(feedbackTarget.missing ? "board.feedbackMissing" : "board.feedbackLocated", { nodes: feedbackTarget.nodeIds.length, edges: feedbackTarget.edgeIds.length })}</p></div>
              <button type="button" onClick={() => setFeedbackTarget(null)} aria-label={t("common.close")}>×</button>
            </div>}
            <div className={styles.editor} ref={editorRef} data-fullscreen={isFullscreen || undefined} onKeyDownCapture={onStyleShortcut}>
              <BoardSurface
                canvasRef={canvasRef}
                view={view}
                fullscreen={isFullscreen}
                empty={nodes.length === 0}
                onPointerMove={pointer.moveConnectionIfActive}
                onPointerUp={pointer.finishConnectionIfActive}
                onPointerCancel={pointer.cancelPointer}
                // A click that ends a pan is not a click on the board.
                onCanvasClick={(onSurface, e) => {
                  if (consumePan() || !onSurface) return;
                  setStyleTargetId(null);
                  if (tool === "text") addText(e.clientX, e.clientY);
                  else cancelConnection();
                }}
                // Double clicking bare board starts a text even with the tool off.
                onCanvasDoubleClick={(onSurface, e) => { if (onSurface) addText(e.clientX, e.clientY); }}
                textTool={tool === "text"}
                controls={
                  <>
                  {(tool === "arrow" || tool === "line") && (
                    <DrawLayer toBoard={boardPoint} onDraft={(p) => setArrowDraft(p)} onDone={addArrow} />
                  )}
                  <div className={styles.canvasTools}>
                    <CanvasTools onAddNode={addNode} onAddShape={addShape} tool={tool} onTool={toggleTool} openRequest={componentsRequest} />
                    {styleTarget && <StylePanel node={styleTarget} onChange={setStyle} onDelete={() => removeNode(styleTarget.id)} />}
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
                  </>
                }
              >
                <BoardEdges
                  edges={edges}
                  nodeById={nodeById}
                  selectedId={inspectingEdgeId}
                  highlightedIds={feedbackTarget?.edgeIds ?? []}
                  connectDrag={connectDrag}
                  onToggle={(id) => setInspectingEdgeId((current) => (current === id ? null : id))}
                  size={WORLD}
                />
                <BoardFreeArrows
                  arrows={nodes.filter((n) => n.type === "arrow")}
                  selectedId={styleTargetId}
                  draft={arrowDraft && { ...arrowDraft, heads: tool === "line" ? "none" : "end" }}
                  size={WORLD}
                  toBoard={boardPoint}
                  onSelect={setStyleTargetId}
                  onMove={(id, points) => patchNode(id, points)}
                  onRemove={removeNode}
                />
                {nodes.filter((n) => n.type !== "arrow").map((n) => n.type === "text" ? (
                  <BoardTextNote
                    key={n.id}
                    node={n}
                    drag={{ down: (e) => pointer.onNodePointerDown(e, n), move: pointer.onNodePointerMove, up: pointer.onNodePointerUp }}
                    onNudge={(dx, dy) => patchNode(n.id, { x: Math.max(0, n.x + dx), y: Math.max(0, n.y + dy) })}
                    onRemove={() => removeNode(n.id)}
                    onLabel={(label) => patchNode(n.id, { label })}
                    onSelect={() => setStyleTargetId(n.id)}
                  />
                ) : n.type === "box" ? (
                  <BoardShape
                    key={n.id}
                    node={n}
                    selected={styleTargetId === n.id}
                    isSource={connectFrom === n.id}
                    drag={{ down: (e) => pointer.onNodePointerDown(e, n), move: pointer.onNodePointerMove, up: pointer.onNodePointerUp }}
                    connect={{ start: (e) => pointer.startConnection(e, n), move: pointer.moveConnectionIfActive, finish: pointer.finishConnectionIfActive }}
                    toBoard={boardPoint}
                    onActivate={() => pointer.onNodeClick(n)}
                    onNudge={(dx, dy) => patchNode(n.id, { x: Math.max(0, n.x + dx), y: Math.max(0, n.y + dy) })}
                    onRemove={() => removeNode(n.id)}
                    onLabel={(label) => patchNode(n.id, { label })}
                    onResize={(r) => patchNode(n.id, r)}
                    onSelect={() => setStyleTargetId(n.id)}
                  />
                ) : (
                  <BoardNodeCard
                    key={n.id}
                    node={n}
                    isSource={connectFrom === n.id}
                    inspecting={inspectingId === n.id}
                    highlighted={feedbackTarget?.nodeIds.includes(n.id) ?? false}
                    drag={{ down: (e) => pointer.onNodePointerDown(e, n), move: pointer.onNodePointerMove, up: pointer.onNodePointerUp }}
                    connect={{ start: (e) => pointer.startConnection(e, n), move: pointer.moveConnectionIfActive, finish: pointer.finishConnectionIfActive }}
                    onActivate={() => pointer.onNodeClick(n)}
                    onNudge={(dx, dy) => patchNode(n.id, { x: Math.max(0, n.x + dx), y: Math.max(0, n.y + dy) })}
                    onRemove={() => removeNode(n.id)}
                    onToggleInspect={() => setInspectingId((current) => (current === n.id ? null : n.id))}
                    selected={styleTargetId === n.id}
                    toBoard={boardPoint}
                    onResize={(r) => patchNode(n.id, r)}
                    onSelect={() => setStyleTargetId(n.id)}
                  />
                ))}
              </BoardSurface>
            </div>

            {/* Once the written round is on offer, the out-loud list would only repeat it. */}
            {result && !free && !sprinting && <EvalResults result={result} pushback={talkDetail && talkGradeEnabled ? [] : buildPushback(scenario, nodes)} showScore={false} change={evaluationChange} onInspect={inspectCheck} />}
          </>
        )}
      </div>
    </WorkspaceLayout>
  );
}
