import React, { useCallback, useEffect, useRef, useState } from "react";
import { meta, SCENARIOS, evaluate } from "@grip/core/arch";
import * as boardEdits from "@grip/core/boardEdits";
import { t } from "@grip/core/i18n";
import { buildPushback } from "@grip/core/pushback";
import { buildGradeFacts } from "@grip/core/talkGrade";
import { emptyTalkTrack, scoreTalkTrack, TALK_TRACK_SECTIONS } from "@grip/core/talkTrack";
import { colors, font } from "@grip/core/tokens";
import { NextUpLink, NextUpShell } from "../components/NextUpShell";
import { WorkspaceLayout } from "../components/WorkspaceLayout";
import { workspaceFocusStyle } from "../components/fieldStyles";
import { NODE_H, NODE_W, WORLD } from "./constants";
import { DesignTimer } from "./DesignTimer";
import { EdgeInspector } from "./EdgeInspector";
import { EvalResults } from "./EvalResults";
import { NodeInspector } from "./NodeInspector";
import { NodePalette } from "./NodePalette";
import { SavedBoardsPanel } from "./SavedBoardsPanel";
import { ScenarioPanel } from "./ScenarioPanel";
import { ScorePanel } from "./ScorePanel";
import { TimerOffer } from "./TimerOffer";
import { ScaleBrief } from "./ScaleBrief";
import { ScenarioForm } from "./ScenarioForm";
import { TalkTrack } from "./TalkTrack";
import { findPlacement } from "./boardGeometry.js";
import { useBoardViewport } from "./useBoardViewport";
import { useFullscreen } from "./useFullscreen";
import { useInView } from "./useInView";
import { ViewportControls } from "./ViewportControls";
import { BoardSurface } from "./BoardSurface";
import { BoardToolbar } from "./BoardToolbar";
import { RailActionButton } from "./RailActionButton";
import { boardStepCopy } from "./stepCopy";
import { useCanvasPointer } from "./useCanvasPointer";
import { BoardEdges } from "./BoardEdges";
import { BoardNodeCard } from "./BoardNodeCard";
import { useBoardDocument, type BoardDoc } from "./useBoardDocument";
import { gradeBlockedKey, gradeDetailFor, gradeVerdict, resumeTime } from "@grip/core/gradeState";
import { appendHandoff } from "./scaleHandoff.js";
import { workflowStep } from "@grip/core/workflowState";
import { WorkflowSteps, type RailAction } from "./WorkflowSteps";
import { useDesignRound } from "./useDesignRound";
import { useScenarioCatalog } from "./useScenarioCatalog";
import { clearBoardHandoff, readBoardHandoff } from "../lib/boardHandoff";
import styles from "./ArchBoard.module.css";
import {
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
import type { AugmentedScenario, BoardEdge, BoardNode, BoardSummary, SavedBoard } from "./types";


export default function ArchBoard() {
  // A story hands over its scenario (new board) or one of its saved boards; cleared once the board mounts.
  const [handoff] = useState(readBoardHandoff);
  useEffect(clearBoardHandoff, []);
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [inspectingId, setInspectingId] = useState<string | null>(null);
  const [inspectingEdgeId, setInspectingEdgeId] = useState<string | null>(null);
  const [result, setResult] = useState<ReturnType<typeof evaluate> | null>(null);
  const [savedOpen, setSavedOpen] = useState(false);
  const [talkOpen, setTalkOpen] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  // The whole editor goes fullscreen, palette included: a board you cannot add
  // to is a picture, not a workspace.
  const { isFullscreen, canFullscreen, toggleFullscreen } = useFullscreen(editorRef);
  // The section the verdict card sends you to; cleared once the cursor lands.
  const [focusSection, setFocusSection] = useState<string | null>(null);
  const round = useDesignRound();
  // Next Up and the step's action repeat in the sticky rail only while scrolled away;
  // the clock joins it only while its own panel is off screen (rule 6).
  const [nextUpVisible, nextUpRef] = useInView(true);
  const [ctaVisible, ctaRef] = useInView(false);
  const [timerVisible, timerRef] = useInView(true);
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [activeBoardTitle, setActiveBoardTitle] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const submittedSnapshotRef = useRef<BoardDoc | null>(null);

  // Any replaced document (commit, undo, redo) invalidates the score and a half-drawn arrow.
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
    }),
    () => { setResult(null); cancelConnection(); },
  );
  const { doc, commit, isDirty } = board;
  const { scenarioId, storyId, nodes, edges, talkSections, talkRating, talkGrade } = doc;

  const nodesRef = useRef<BoardNode[]>([]);
  nodesRef.current = nodes;
  const { view, setView, toBoard, zoomStep, resetZoom, fit, consumePan } = useBoardViewport(canvasRef, nodesRef);
  const pointer = useCanvasPointer({
    nodes,
    setNodes: board.setNodes,
    canvasPoint: (e) => (canvasRef.current ? toBoard(e.clientX, e.clientY) : null),
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
        if (event.shiftKey) board.redo();
        else board.undo();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

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
  const gradeMutation = useGradeTalkTrackMutation((graded) => board.setTalkGrade(graded.score));

  const mayDiscard = () => !isDirty || window.confirm(t("board.discardConfirm"));
  // Replaces the whole document (load or new scenario) and clears everything derived from it.
  const startDocument = (next: BoardDoc, active: { id: string | null; title: string | null }) => {
    board.reset(next);
    cancelConnection();
    setResult(null);
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
  const liveCost = nodes.reduce((s, n) => s + meta(n.type).cost, 0);
  const liveMaint = nodes.reduce((s, n) => s + meta(n.type).maint, 0);
  const talkAnswered = scoreTalkTrack({ sections: talkSections, rating: talkRating }).answered.length;

  const switchScenario = (id: string) => {
    if (!mayDiscard()) return;
    setView({ scale: 1, x: 0, y: 0 });
    startDocument(
      { scenarioId: id, storyId: null, nodes: [], edges: [], talkSections: emptyTalkTrack(), talkRating: null, talkGrade: null },
      { id: null, title: null },
    );
  };

  // New nodes land in the visible part of the board, wherever the user has panned or zoomed.
  const addNode = (type: string) => {
    const origin = { x: Math.max(0, -view.x / view.scale), y: Math.max(0, -view.y / view.scale) };
    const visible = { width: (canvasRef.current?.clientWidth ?? 480) / view.scale, height: (canvasRef.current?.clientHeight ?? 560) / view.scale };
    const shifted = nodes.map((n) => ({ ...n, x: n.x - origin.x, y: n.y - origin.y }));
    const point = findPlacement(shifted, visible, { width: NODE_W, height: NODE_H });
    edit(boardEdits.addNode({ nodes, edges }, type, { x: point.x + origin.x, y: point.y + origin.y }));
  };

  // Structural edits follow core's rules; a commit also clears the score (applySnapshot).
  const edit = (next: { nodes: BoardNode[]; edges: BoardEdge[] }) => {
    if (next.nodes !== nodes || next.edges !== edges) commit(next);
  };

  const removeNode = (id: string) => {
    edit(boardEdits.removeNode({ nodes, edges }, id));
    if (connectFrom === id || connectDrag?.from === id) cancelConnection();
    if (inspectingId === id) setInspectingId(null);
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
  const stepCopy = boardStepCopy({
    step: activeWorkflowStep,
    connectFromName: connectFrom ? nodeName(connectFrom) : null,
    scenarioName: scenario.name,
    verdict,
    weakestLabel,
  });
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

  return (
    <WorkspaceLayout
      mainLabel={t("board.title")}
      lockedHint={creatorOpen ? t("board.lockedHint") : null}
      left={
        <>
          <ScenarioPanel
            scenario={scenario}
            scenarioCount={allScenarios.length}
            scenarioOptions={scenarioOptions}
            onSwitch={switchScenario}
            board={{ id: activeBoardId, storyId, onStoryChange: (id) => commit({ storyId: id }) }}
            onNewScenario={() => setCreatorOpen(true)}
            onDeleteScenario={() => window.confirm(t("board.deleteScenarioConfirm", { name: scenario.name })) && deleteScenarioMutation.mutate(scenario.id)}
            errors={[
              deleteScenarioMutation.error ? t("board.deleteFailed", { message: deleteScenarioMutation.error.message }) : null,
              scenariosError ? t("board.scenariosError") : null,
            ]}
          />

          <ScaleBrief
            key={scenario.id}
            scenario={scenario}
            onUseInTalkTrack={(text) => {
              // Same commit shape as typing in the section: the grade belongs to
              // the text that earned it, so it clears.
              commit({
                talkSections: { ...talkSections, scale: appendHandoff(talkSections.scale ?? "", text) },
                talkGrade: null,
              });
              setTalkOpen(true);
              setFocusSection("scale");
            }}
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
          {/* Right rail: the score first, then the round and the budget; inspectors sit beside the canvas (rule 13). */}
          <ScorePanel result={result} cost={liveCost} budget={scenario.budget} maint={liveMaint} />

          {round.started ? (
            <div ref={timerRef}>
              <DesignTimer round={round} />
            </div>
          ) : (
            activeWorkflowStep === 1 && <TimerOffer onStart={round.start} />
          )}

          {/* Above the sections it opens, where the round used to sit: the button
              and the thing it produces share a place, so pressing it reads as
              the panel arriving rather than something happening elsewhere.
              Inset on every side by the halo's own width. The rail scrolls its
              overflow and this is usually its last child, so without the room
              the ring is cut off at the sides and along the bottom edge. */}
          {actionInRightRail && (
            <div ref={ctaRef} style={{ padding: 8 }}>
              <RailActionButton action={primaryAction} />
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
                commit({ talkSections: { ...talkSections, [id]: value }, talkGrade: null });
              }}
              onChangeRating={(value) => {
                commit({ talkRating: value, talkGrade: null });
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

            <BoardToolbar
              status={{ text: statusText, dirty: isDirty }}
              history={{
                canUndo: board.canUndo,
                canRedo: board.canRedo,
                onUndo: board.undo,
                onRedo: board.redo,
              }}
              talk={{ open: talkOpen, answered: talkAnswered, onToggle: () => setTalkOpen((value) => !value) }}
              save={{ pending: saveBoardMutation.isPending, onSave: saveBoard }}
              onClear={() => commit({ nodes: [], edges: [], talkSections: emptyTalkTrack(), talkRating: null, talkGrade: null })}
              arrows={{
                options: edges.map((edge) => ({
                  label: `${nodeName(edge.from)} → ${nodeName(edge.to)}${edge.protocol ? ` · ${edge.protocol}` : ""}`,
                  value: edge.id,
                })),
                selectedId: inspectingEdgeId,
                onSelect: setInspectingEdgeId,
              }}
            />
            {/* The one-board-per-story index gets words of its own; the story picker normally prevents it. */}
            {saveBoardMutation.error && (
              <p role="alert" style={{ margin: "0 0 10px", fontSize: font.size.small, color: colors.dangerBright }}>
                {saveBoardMutation.error.message.includes("arch_boards_one_per_story")
                  ? t("board.storyTakenError")
                  : `${t("board.saveFailedTitle")}: ${saveBoardMutation.error.message}`}</p>
            )}

            <div className={styles.editor} ref={editorRef} data-fullscreen={isFullscreen || undefined}>
              <NodePalette onAddNode={addNode} />
              <BoardSurface
                canvasRef={canvasRef}
                view={view}
                fullscreen={isFullscreen}
                empty={nodes.length === 0}
                onPointerMove={pointer.moveConnectionIfActive}
                onPointerUp={pointer.finishConnectionIfActive}
                onPointerCancel={pointer.cancelPointer}
                // A click that ends a pan is not a click on the board.
                onCanvasClick={(onSurface) => { if (!consumePan() && onSurface) cancelConnection(); }}
                controls={
                  <ViewportControls
                    scale={view.scale}
                    onZoomIn={() => zoomStep(1)}
                    onZoomOut={() => zoomStep(-1)}
                    onReset={resetZoom}
                    onFit={() => fit(nodes)}
                    isFullscreen={isFullscreen}
                    onToggleFullscreen={canFullscreen ? toggleFullscreen : null}
                  />
                }
              >
                <BoardEdges
                  edges={edges}
                  nodeById={nodeById}
                  selectedId={inspectingEdgeId}
                  connectDrag={connectDrag}
                  onToggle={(id) => setInspectingEdgeId((current) => (current === id ? null : id))}
                  size={WORLD}
                />
                {nodes.map((n) => (
                  <BoardNodeCard
                    key={n.id}
                    node={n}
                    isSource={connectFrom === n.id}
                    inspecting={inspectingId === n.id}
                    drag={{ down: (e) => pointer.onNodePointerDown(e, n), move: pointer.onNodePointerMove, up: pointer.onNodePointerUp }}
                    connect={{ start: (e) => pointer.startConnection(e, n), move: pointer.moveConnectionIfActive, finish: pointer.finishConnectionIfActive }}
                    onActivate={() => pointer.onNodeClick(n)}
                    onNudge={(dx, dy) => patchNode(n.id, { x: Math.max(0, n.x + dx), y: Math.max(0, n.y + dy) })}
                    onRemove={() => removeNode(n.id)}
                    onToggleInspect={() => setInspectingId((current) => (current === n.id ? null : n.id))}
                  />
                ))}
              </BoardSurface>
            </div>

            {result && <EvalResults result={result} scenario={scenario} pushback={buildPushback(scenario, nodes)} showScore={false} />}
          </>
        )}
      </div>
    </WorkspaceLayout>
  );
}
