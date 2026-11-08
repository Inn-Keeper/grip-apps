import { useEffect, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, Share, Text, TextInput, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { setTabBarHidden } from "@/lib/uiStore";
import { SCENARIOS, SHAPE_SIZE, designOnly, findPlacement, nodeSize, evaluate, isFreeScenario, type FreeStyle } from "@grip/core/arch";
import { buildPushback } from "@grip/core/pushback";
import { emptyTalkTrack, scoreTalkTrack, TALK_TRACK_SECTIONS } from "@grip/core/talkTrack";
import * as boardEdits from "@grip/core/boardEdits";
import { t } from "@grip/core/i18n";
import { boardStepCopy, workflowStep } from "@grip/core/workflowState";
import { buildGradeFacts } from "@grip/core/talkGrade";
import { assessmentFor, gradeBlockedKey, gradeInputsKey, gradeStillApplies, gradeVerdict, makeAssessment, resumeTime, topologyChanged } from "@grip/core/gradeState";
import { useLocale } from "@/lib/useLocale";
import type { BoardEdge, BoardNode, EvalResult } from "@grip/core/arch";
import type { SavedBoard, TalkAssessment } from "@grip/core/api";
import { font, layout, useTheme } from "@/theme";
import { ROUND_MINUTES } from "@grip/core/designTimer";
import { Screen, ScreenHeader } from "@/components/ui";
import { BrandIcon } from "@/components/BrandIcon";
import { useBoardHistory } from "@/hooks/useBoardHistory";
import { useIsDemo } from "@/lib/useIsDemo";
import { BoardCanvas, type BoardCanvasHandle } from "@/components/board/BoardCanvas";
import { NODE_H, NODE_W } from "@/components/board/NodeView";
import { DesignTimerBar, useDesignTimer } from "@/components/board/DesignTimerBar";
import { ResultSheet } from "@/components/board/ResultSheet";
import { EdgeInspectorSheet } from "@/components/board/EdgeInspectorSheet";
import { NodeInspectorSheet } from "@/components/board/NodeInspectorSheet";
import { TalkTrackSheet } from "@/components/board/TalkTrackSheet";
import { ScenarioSheet } from "@/components/board/ScenarioSheet";
import { StorySheet } from "@/components/board/StorySheet";
import { BoardProgress } from "@/components/board/BoardProgress";
import { BoardTools, type Shape, type Tool } from "@/components/board/BoardTools";
import { ComponentsSheet } from "@/components/board/ComponentsSheet";
import { StyleBar } from "@/components/board/StyleBar";
import { BoardToolbar, type Chrome } from "@/components/board/BoardToolbar";
import { SavedBoardsTray } from "@/components/board/SavedBoardsTray";
import { ZenOverlay } from "@/components/board/ZenOverlay";
import { useStoriesQuery } from "@/queries/stories";
import {
  talkGradeEnabled,
  useDeleteBoardMutation,
  useGradeTalkTrackMutation,
  useGradingStatusQuery,
  useSaveBoardMutation,
  useSavedBoardsQuery,
  useShareBoardMutation,
  useScenarioCatalog,
} from "@/queries/board";
import { WEB_URL } from "@/lib/webUrl";


export default function BoardScreen() {
  const { colors } = useTheme();
  const locale = useLocale();
  const insets = useSafeAreaInsets();
  const [scenarioId, setScenarioId] = useState(SCENARIOS[0].id);
  const [pickerOpen, setPickerOpen] = useState(false);
  // The story this board is designed for (one board per story), as on web.
  const [storyId, setStoryId] = useState<string | null>(null);
  const [storyOpen, setStoryOpen] = useState(false);
  // A free board's own brief: what the AI grader reads the talk track against.
  const [brief, setBrief] = useState("");
  // The armed tool (Text waits for a tap, Arrow and Line for a drag) and the selected node.
  const [tool, setTool] = useState<Tool | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [componentsOpen, setComponentsOpen] = useState(false);
  const canvasRef = useRef<BoardCanvasHandle>(null);
  // Bumped when a different board or scenario is shown, so the canvas re-frames (saving doesn't bump it).
  const [viewKey, setViewKey] = useState(0);
  const [nodes, setNodes] = useState<BoardNode[]>([]);
  const [edges, setEdges] = useState<BoardEdge[]>([]);
  // The last evaluation stays after its sheet closes: it moves the board past step 3.
  // Structural edits clear it, as on web; the talk track does not.
  const [result, setResult] = useState<EvalResult | null>(null);
  const [resultOpen, setResultOpen] = useState(false);
  const [inspectingEdgeId, setInspectingEdgeId] = useState<string | null>(null);
  const [savedOpen, setSavedOpen] = useState(false);
  const [talkOpen, setTalkOpen] = useState(false);
  const [inspectingId, setInspectingId] = useState<string | null>(null);
  const [talkSections, setTalkSections] = useState<Record<string, string>>(emptyTalkTrack);
  const [talkRating, setTalkRating] = useState<number | null>(null);
  const [talkGrade, setTalkGrade] = useState<number | null>(null);
  // The detail behind talkGrade, saved with the board and tied to the inputs it graded.
  const [talkAssessment, setTalkAssessment] = useState<TalkAssessment | null>(null);
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [activeBoardTitle, setActiveBoardTitle] = useState<string | null>(null);
  // Chrome levels: full (pills + brief), compact (slim row), zen (board only,
  // translucent title overlaid on the canvas).
  const [chrome, setChrome] = useState<Chrome>("full");

  // Zen also hides the native tab bar; restore it when leaving the screen.
  useEffect(() => {
    setTabBarHidden(chrome === "zen");
    return () => setTabBarHidden(false);
  }, [chrome]);

  const timer = useDesignTimer();
  const { allScenarios, groups: scenarioGroups, isFetching: scenariosFetching } = useScenarioCatalog();
  const { data: stories = [] } = useStoriesQuery();
  // A custom scenario may still be loading; show the first built-in until it arrives.
  const scenario = allScenarios.find((item) => item.id === scenarioId) ?? SCENARIOS[0];
  const { data: savedBoards = [], error: boardsError } = useSavedBoardsQuery();
  const saveBoardMutation = useSaveBoardMutation(
    (board) => {
      setActiveBoardId(board.id ?? null);
      setActiveBoardTitle(board.title);
    },
    // The one-board-per-story index gets words of its own; the story sheet normally prevents it.
    (error) => Alert.alert(t("board.saveFailedTitle"), error.message.includes("arch_boards_one_per_story") ? t("board.storyTakenError") : error.message)
  );
  const deleteBoardMutation = useDeleteBoardMutation(
    (id) => {
      if (id === activeBoardId) {
        setActiveBoardId(null);
        setActiveBoardTitle(null);
      }
    },
    (error) => Alert.alert(t("common.delete"), error.message)
  );
  const talkAnswered = scoreTalkTrack({ sections: talkSections, rating: talkRating }).answered.length;
  // Free boxes and text are notes, so they don't move the journey forward.
  // A free board has no checklist: no steps and no Evaluate.
  const free = isFreeScenario(scenario.id);
  const design = designOnly(nodes, edges);
  // What the reasoning grade depends on; a saved assessment whose inputs changed no longer counts.
  const gradeDoc = { scenarioId, nodes, edges, talkSections, talkRating, brief, talkGrade, talkAssessment };
  const assessmentStale = talkAssessment !== null && assessmentFor(gradeDoc, activeBoardId) === null;
  const liveGrade = assessmentStale ? null : talkGrade;
  const clearGrade = () => { setTalkGrade(null); setTalkAssessment(null); };
  const step = workflowStep(design.nodes.length, design.edges.length, result !== null, liveGrade !== null);

  // A late answer applies only to the board and inputs it was asked about.
  const submittedGradeRef = useRef<{ boardId: string; inputs: string } | null>(null);
  const liveRef = useRef({ doc: gradeDoc, boardId: activeBoardId });
  liveRef.current = { doc: gradeDoc, boardId: activeBoardId };
  const gradeMutation = useGradeTalkTrackMutation((graded) => {
    const { doc, boardId } = liveRef.current;
    if (!gradeStillApplies(submittedGradeRef.current, boardId, doc)) return;
    setTalkGrade(graded.score);
    setTalkAssessment(makeAssessment(doc, graded));
  });
  const { data: gradingStatus } = useGradingStatusQuery(talkOpen);
  // The grader checks the arithmetic against the design checks, so evaluate here if needed.
  const gradeTalkTrack = () => {
    if (!activeBoardId) return;
    submittedGradeRef.current = { boardId: activeBoardId, inputs: gradeInputsKey(gradeDoc) };
    gradeMutation.mutate({
      boardId: activeBoardId,
      facts: buildGradeFacts(free ? { ...scenario, brief: brief.trim() } : scenario, nodes, result ?? evaluate(scenario, nodes, edges)),
      sections: talkSections,
      selfRating: talkRating,
    });
  };
  // Written, not "covered": the grader's floor is any text at all.
  const talkWritten = TALK_TRACK_SECTIONS.filter(({ id }) => (talkSections[id] ?? "").trim()).length;
  const limit = gradingStatus?.grading === "unavailable" ? gradingStatus : null;
  const blockedKey = free && !brief.trim() ? "board.gradeNeedsBrief" : gradeBlockedKey(activeBoardId, talkWritten, Boolean(limit));
  // Null once what it graded changed, or on a legacy score-only board.
  const talkDetail = assessmentFor(gradeDoc, activeBoardId);
  const verdict = gradeVerdict(talkDetail, TALK_TRACK_SECTIONS.map((section) => section.id));
  const weakestLabel = TALK_TRACK_SECTIONS.find((section) => section.id === verdict?.weakest?.section)?.label ?? "";
  // Steps 1 to 3 end in Evaluate, already in the toolbar; from 4 the action is the talk track.
  const stepCopy = boardStepCopy({ step, scenarioName: scenario.name, verdict, weakestLabel, touch: true });
  const evaluateBoard = () => {
    setResult(evaluate(scenario, nodes, edges));
    setResultOpen(true);
  };

  const saveBoard = () =>
    saveBoardMutation.mutate({
      id: activeBoardId ?? undefined,
      title: activeBoardTitle ?? t("board.draftTitle", { scenario: scenario.name }),
      scenarioId: scenario.id,
      storyId,
      nodes,
      edges,
      talkTrack: { sections: talkSections, rating: talkRating },
      talkGrade: liveGrade,
      talkAssessment: assessmentStale ? null : talkAssessment,
      brief,
    });

  const clearBoard = () => {
    setNodes([]);
    setEdges([]);
    setTalkSections(emptyTalkTrack());
    setTalkRating(null);
    clearGrade();
    setResult(null);
    setActiveBoardId(null);
    setActiveBoardTitle(null);
    setSelectedId(null);
  };

  const switchScenario = (id: string) => {
    setScenarioId(id);
    setBrief("");
    setStoryId(null);
    clearBoard();
    setViewKey((key) => key + 1);
  };

  // New nodes land in the visible part of the canvas, wherever the user has panned.
  // Structural edits follow core's rules (shared with web) and invalidate the score.
  // As on web: the topology result drops only when the diagram's meaning changed (not a move,
  // resize or style). A saved assessment goes stale on its own (assessmentFor); a legacy
  // score-only grade has no fingerprint, so it is cleared when what it graded changes.
  const invalidate = (patch: Partial<typeof gradeDoc>) => {
    const next = { ...gradeDoc, ...patch };
    if (topologyChanged(gradeDoc, next)) setResult(null);
    if (!talkAssessment && gradeInputsKey(gradeDoc) !== gradeInputsKey(next)) clearGrade();
  };
  const edit = (next: { nodes: BoardNode[]; edges: BoardEdge[] }) => {
    invalidate(next);
    setNodes(next.nodes);
    setEdges(next.edges);
  };

  const history = useBoardHistory({ nodes, edges }, viewKey, (doc) => {
    invalidate(doc);
    setNodes(doc.nodes);
    setEdges(doc.edges);
    setSelectedId(null);
  });

  // New nodes take the first free spot in view, clear of every node at its real size (core, shared with web).
  const placeFor = (size: { width: number; height: number }) => {
    const area = canvasRef.current?.visibleArea() ?? { x: 0, y: 0, width: 400, height: 600 };
    const shifted = nodes.map((node) => ({ ...node, x: node.x - area.x, y: node.y - area.y }));
    const point = findPlacement(shifted, area, size, (node: BoardNode) => nodeSize(node, { width: NODE_W, height: NODE_H }));
    return { x: point.x + area.x, y: point.y + area.y };
  };

  const addNode = (type: string) => {
    const next = boardEdits.addNode({ nodes, edges }, type, placeFor({ width: NODE_W, height: NODE_H }));
    edit(next);
    // Free text opens straight into its editor; a box may stay empty, as on web.
    if (type === "text") setInspectingId(next.nodes[next.nodes.length - 1].id);
  };

  // A shape lands at its starting size where the user is looking, selected so it can be styled at once.
  const addShape = (shape: Shape) => {
    const { w, h } = SHAPE_SIZE[shape];
    const next = boardEdits.addNode({ nodes, edges }, "box", placeFor({ width: w, height: h }), { shape, w, h });
    edit(next);
    setSelectedId(next.nodes[next.nodes.length - 1].id);
  };
  // The Text tool places a text where the board was tapped and opens its editor; tools are one-shot, as on web.
  const placeText = (x: number, y: number) => {
    const next = boardEdits.addNode({ nodes, edges }, "text", { x: Math.max(0, x - 6), y: Math.max(0, y - 14) });
    edit(next);
    setInspectingId(next.nodes[next.nodes.length - 1].id);
    setTool(null);
  };
  // A line is an arrow without heads.
  const drawArrow = (points: { x: number; y: number; x2: number; y2: number }) => {
    const next = boardEdits.addNode({ nodes, edges }, "arrow", { x: points.x, y: points.y }, { x2: points.x2, y2: points.y2, ...(tool === "line" ? { style: { heads: "none" as const } } : {}) });
    edit(next);
    setSelectedId(next.nodes[next.nodes.length - 1].id);
    setTool(null);
  };
  // Live updates while a finger drags: free arrows and sizes never change the grade.
  const patchLive = (id: string, patch: Partial<BoardNode>) =>
    setNodes((current) => current.map((node) => (node.id === id ? { ...node, ...patch } : node)));
  const selected = nodes.find((node) => node.id === selectedId) ?? null;
  const setStyle = (patch: FreeStyle) => selected && patchNode(selected.id, { style: { ...selected.style, ...patch } });

  const moveNode = (id: string, x: number, y: number) =>
    setNodes((current) => current.map((node) => (node.id === id ? { ...node, x, y } : node)));

  const removeNode = (id: string) => {
    edit(boardEdits.removeNode({ nodes, edges }, id));
    if (inspectingId === id) setInspectingId(null);
    if (selectedId === id) setSelectedId(null);
  };

  const patchNode = (id: string, patch: Partial<BoardNode>) => edit(boardEdits.patchNode({ nodes, edges }, id, patch));

  const isDemo = useIsDemo();
  const shareMutation = useShareBoardMutation((error) => Alert.alert(t("board.share"), error.message));
  // Turns the link on if needed, then the iOS share sheet; the link opens web's read-only page.
  const shareBoard = async (board: SavedBoard) => {
    if (!board.id) return;
    const token = board.shareToken ?? await shareMutation.mutateAsync({ id: board.id, enable: true }).catch(() => null);
    if (token) await Share.share({ message: `${WEB_URL}/share/${token}` });
  };

  const loadBoard = (board: SavedBoard) => {
    if (!allScenarios.some((item) => item.id === board.scenarioId)) {
      Alert.alert(t("board.unknownScenarioTitle"), t("board.unknownScenarioMessage", { scenarioId: board.scenarioId }));
      return;
    }
    setScenarioId(board.scenarioId);
    setStoryId(board.storyId ?? null);
    setBrief(board.brief ?? "");
    setViewKey((key) => key + 1);
    setNodes(board.nodes);
    setEdges(board.edges);
    setTalkSections({ ...emptyTalkTrack(), ...(board.talkTrack?.sections ?? {}) });
    setTalkRating(board.talkTrack?.rating ?? null);
    setTalkGrade(board.talkGrade ?? null);
    setTalkAssessment(board.talkAssessment ?? null);
    setResult(null);
    setActiveBoardId(board.id ?? null);
    setActiveBoardTitle(board.title);
    setSavedOpen(false);
  };

  const confirmDeleteBoard = (board: SavedBoard) => {
    const id = board.id;
    if (!id) return;

    Alert.alert(t("board.deleteTitle"), t("board.deleteMessage", { title: board.title }), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("common.delete"), style: "destructive", onPress: () => deleteBoardMutation.mutate(id) },
    ]);
  };

  const currentStory = stories.find((story) => story.id === storyId);
  // The board's own link counts even if the story was since pointed at another scenario.
  // A free board has no scenario to match, so any story can be its subject.
  const storyCandidates = free ? stories : stories.filter((story) => story.scenarioId === scenario.id || story.id === storyId);
  const takenStories = new Set(savedBoards.filter((board) => board.id !== activeBoardId && board.storyId).map((board) => board.storyId));

  // A story's "New board" or "Open" arrives as route params. It waits for the saved boards
  // and custom scenarios it needs, runs once, then clears the params. The ref keeps the
  // effect to its real triggers while still calling this render's loadBoard/switchScenario.
  const router = useRouter();
  const params = useLocalSearchParams<{ scenarioId?: string; storyId?: string; boardId?: string }>();
  const handoffRef = useRef<() => boolean>(() => true);
  handoffRef.current = () => {
    if (params.boardId) {
      const board = savedBoards.find((item) => item.id === params.boardId);
      if (!board) return false;
      if (!allScenarios.some((item) => item.id === board.scenarioId) && scenariosFetching) return false;
      loadBoard(board);
      return true;
    }
    if (params.scenarioId) {
      if (!allScenarios.some((item) => item.id === params.scenarioId) && scenariosFetching) return false;
      switchScenario(params.scenarioId);
      setStoryId(params.storyId ?? null);
    }
    return true;
  };
  useEffect(() => {
    if (!params.boardId && !params.scenarioId) return;
    if (handoffRef.current()) router.setParams({ scenarioId: undefined, storyId: undefined, boardId: undefined });
  }, [params.boardId, params.scenarioId, params.storyId, savedBoards, scenariosFetching, router]);

  const addEdge = (from: string, to: string) => edit(boardEdits.addEdge({ nodes, edges }, from, to));

  // Tapping an arrow opens its inspector (label it, or remove it from there)
  // rather than deleting on contact.
  const removeEdge = (id: string) => {
    edit(boardEdits.removeEdge({ nodes, edges }, id));
    setInspectingEdgeId(null);
  };

  const patchEdge = (id: string, patch: Partial<BoardEdge>) => edit(boardEdits.patchEdge({ nodes, edges }, id, patch));

  return (
    <Screen key={locale}>
      {chrome === "full" && (
        <Animated.View entering={FadeInDown.duration(180)}>
          <ScreenHeader title={t("tabs.board")} subtitle={scenario.brief}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={t("board.pickScenario")}
              accessibilityValue={{ text: scenario.name }}
              onPress={() => setPickerOpen(true)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                minHeight: 44,
                paddingHorizontal: 12,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surface
              }}
            >
              <Text numberOfLines={1} style={{
                  flex: 1,
                  fontSize: font.size.bodyMd,
                  fontWeight: "600",
                  color: colors.textBright
                }}>{scenario.name}</Text>
              <BrandIcon name="arrowDown" color={colors.textFaint} size={12} />
            </TouchableOpacity>
            {storyCandidates.length > 0 && (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={t("board.storyLabel")}
                accessibilityValue={{ text: currentStory?.title ?? t("board.noStory") }}
                onPress={() => setStoryOpen(true)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  minHeight: 40,
                  marginTop: 8,
                  paddingHorizontal: 12,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.surface
                }}
              >
                <BrandIcon name="story" color={currentStory ? colors.accentBright : colors.textFaint} size={14} />
                <Text numberOfLines={1} style={{
                    flex: 1,
                    fontSize: font.size.body,
                    fontWeight: "600",
                    color: currentStory ? colors.text : colors.textFaint
                  }}>
                  {currentStory?.title ?? t("board.noStory")}
                </Text>
                <BrandIcon name="arrowDown" color={colors.textFaint} size={12} />
              </TouchableOpacity>
            )}
            {free && (
              <TextInput
                value={brief}
                onChangeText={(value) => { invalidate({ brief: value }); setBrief(value); }}
                placeholder={t("board.freeBriefPlaceholder")}
                placeholderTextColor={colors.textFaint}
                accessibilityLabel={t("board.freeBriefLabel")}
                accessibilityHint={t("board.freeBriefHint")}
                multiline
                maxLength={2000}
                style={{
                  marginTop: 8,
                  minHeight: 44,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.bgDeep,
                  color: colors.text,
                  fontSize: font.size.body
                }}
              />
            )}
          </ScreenHeader>
        </Animated.View>
      )}

      <View
        style={{
          flex: 1,
          paddingTop: chrome === "full" ? 8 : 6,
          paddingHorizontal: 6,
          gap: 8,
          paddingBottom: chrome === "zen" ? insets.bottom + 4 : insets.bottom + layout.tabBarClearance,
        }}
      >
      {chrome === "full" && !free && (
        <BoardProgress
          step={step}
          title={stepCopy.title}
          sub={stepCopy.sub}
          action={
            step >= 4
              ? { label: t("board.explainAction"), onPress: () => setTalkOpen(true) }
              // As on web, an empty board's first action opens the Components picker.
              : step === 1 ? { label: t("board.addComponentAction"), onPress: () => setComponentsOpen(true) } : null
          }
        />
      )}

      {/* As on web: the timer shows once a round starts; until then an offer, on the first step only. */}
      {chrome !== "zen" && timer.started && <DesignTimerBar timer={timer} />}
      {chrome !== "zen" && (!timer.started && step === 1 || chrome === "compact") && (
        <View style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12
          }}>
        {!timer.started && step === 1 && <TouchableOpacity accessibilityHint={t("timer.offerHint", { minutes: ROUND_MINUTES })} onPress={timer.toggle} accessibilityRole="link" style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingVertical: 6
          }}>
          <BrandIcon name="clock" color={colors.accentBright} size={16} />
          <Text style={{
              fontSize: font.size.small,
              fontWeight: "600",
              color: colors.accentBright,
              textDecorationLine: "underline"
            }}>{t("timer.offer")}</Text>
        </TouchableOpacity>}
        {chrome === "compact" && (
          <Text numberOfLines={1} style={{
              flex: 1,
              fontSize: font.size.small,
              fontWeight: "600",
              color: colors.textDim
            }}>{scenario.name}</Text>
        )}
        </View>
      )}

      {chrome !== "zen" && (
        <BoardToolbar
          chrome={chrome}
          onChrome={setChrome}
          talkAnswered={talkAnswered}
          talkOpen={talkOpen}
          savedOpen={savedOpen}
          saving={saveBoardMutation.isPending}
          canEvaluate={nodes.length > 0 && !free}
          onOpenTalk={() => setTalkOpen(true)}
          onToggleSaved={() => setSavedOpen((value) => !value)}
          onSave={saveBoard}
          onClear={clearBoard}
          onEvaluate={evaluateBoard}
          history={history}
        />
      )}

      {boardsError && chrome !== "zen" && (
        <Text style={{
            fontSize: font.size.small,
            color: colors.dangerBright
          }}>
          {t("board.boardsError", { message: boardsError.message })}
        </Text>
      )}

      {savedOpen && chrome !== "zen" && (
        <SavedBoardsTray boards={savedBoards} scenarios={allScenarios} stories={stories} activeId={activeBoardId} onLoad={loadBoard} onDelete={confirmDeleteBoard} onShare={isDemo ? null : shareBoard} onUnshare={(board) => board.id && shareMutation.mutate({ id: board.id, enable: false })} />
      )}

      <View style={{ flex: 1 }}>
        <BoardCanvas
          ref={canvasRef}
          fitKey={viewKey}
          onZen={chrome === "zen" ? undefined : () => setChrome("zen")}
          nodes={nodes}
          edges={edges}
          onMoveNode={moveNode}
          onRemoveNode={removeNode}
          onAddEdge={addEdge}
          onTapEdge={setInspectingEdgeId}
          onInspectNode={(id) => setInspectingId(id)}
          tool={tool}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onPlaceText={placeText}
          onDrawArrow={drawArrow}
          onMoveArrow={patchLive}
          onResizeNode={patchLive}
        />

        {/* Zen only: in the other modes the header already names the scenario, and this would cover nodes. */}
        {chrome === "zen" && (
          <ZenOverlay
            label={`${scenario.name}${timer.started ? ` · ${timer.clock}` : ""}`}
            onExit={() => setChrome("compact")}
          />
        )}

        {selected && <StyleBar node={selected} onChange={setStyle} onDelete={() => removeNode(selected.id)} />}

        <BoardTools
          onOpenComponents={() => setComponentsOpen(true)}
          onAddShape={addShape}
          tool={tool}
          onTool={(name) => setTool((current) => (current === name ? null : name))}
        />
      </View>

        <EdgeInspectorSheet
          edge={edges.find((edge) => edge.id === inspectingEdgeId) ?? null}
          from={nodes.find((n) => n.id === edges.find((e) => e.id === inspectingEdgeId)?.from)}
          to={nodes.find((n) => n.id === edges.find((e) => e.id === inspectingEdgeId)?.to)}
          onChange={(patch) => inspectingEdgeId && patchEdge(inspectingEdgeId, patch)}
          onRemove={() => inspectingEdgeId && removeEdge(inspectingEdgeId)}
          onClose={() => setInspectingEdgeId(null)}
        />

        <NodeInspectorSheet
          node={nodes.find((node) => node.id === inspectingId) ?? null}
          onChange={(patch) => inspectingId && patchNode(inspectingId, patch)}
          onClose={() => setInspectingId(null)}
          onRemove={() => inspectingId && removeNode(inspectingId)}
        />


        <TalkTrackSheet
          visible={talkOpen}
          free={free}
          sections={talkSections}
          rating={talkRating}
          onChangeSection={(id, value) => {
            setTalkSections((prev) => ({ ...prev, [id]: value }));
            clearGrade();
          }}
          onChangeRating={(value) => {
            setTalkRating(value);
            clearGrade();
          }}
          onClose={() => setTalkOpen(false)}
          grade={liveGrade}
          gradeDetail={talkDetail}
          grading={gradeMutation.isPending}
          gradeError={gradeMutation.error}
          gradeBlocked={blockedKey ? t(blockedKey, limit ? { time: resumeTime(limit.retry_after) } : undefined) : null}
          onGrade={talkGradeEnabled ? gradeTalkTrack : null}
        />

        <ScenarioSheet
          visible={pickerOpen}
          groups={scenarioGroups}
          activeId={scenario.id}
          onPick={(id) => id !== scenario.id && switchScenario(id)}
          onClose={() => setPickerOpen(false)}
        />

        <StorySheet
          visible={storyOpen}
          candidates={storyCandidates}
          current={currentStory}
          taken={takenStories}
          onPick={setStoryId}
          onClose={() => setStoryOpen(false)}
        />

        <ComponentsSheet visible={componentsOpen} onAdd={addNode} onClose={() => setComponentsOpen(false)} />

        <ResultSheet
          result={resultOpen ? result : null}
          pushback={buildPushback(scenario, nodes)}
          onClose={() => setResultOpen(false)}
        />
      </View>
    </Screen>
  );
}
