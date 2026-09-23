import { useEffect, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { setTabBarHidden } from "@/lib/uiStore";
import { NODE_TYPES, SCENARIOS, TYPE_COLORS, evaluate, meta } from "@grip/core/arch";
import { buildPushback } from "@grip/core/pushback";
import { emptyTalkTrack, scoreTalkTrack, TALK_TRACK_SECTIONS } from "@grip/core/talkTrack";
import { t } from "@grip/core/i18n";
import { useLocale } from "@/lib/useLocale";
import type { BoardEdge, BoardNode, EvalResult, Scenario } from "@grip/core/arch";
import type { SavedBoard, Story } from "@grip/core/api";
import { colors, layout, shadow } from "@/theme";
import { Button, MiniButton, Screen, ScreenHeader } from "@/components/ui";
import { BrandIcon, nodeIconName } from "@/components/BrandIcon";
import { BoardCanvas, type BoardCanvasHandle } from "@/components/board/BoardCanvas";
import { DesignTimerBar, useDesignTimer } from "@/components/board/DesignTimerBar";
import { ResultSheet } from "@/components/board/ResultSheet";
import { EdgeInspectorSheet } from "@/components/board/EdgeInspectorSheet";
import { NodeInspectorSheet } from "@/components/board/NodeInspectorSheet";
import { ScaleSheet } from "@/components/board/ScaleSheet";
import { TalkTrackSheet } from "@/components/board/TalkTrackSheet";
import { ScenarioSheet } from "@/components/board/ScenarioSheet";
import { StorySheet } from "@/components/board/StorySheet";
import { useStoriesQuery } from "@/queries/stories";
import { useDeleteBoardMutation, useSaveBoardMutation, useSavedBoardsQuery, useScenarioCatalog } from "@/queries/board";

export default function BoardScreen() {
  const locale = useLocale();
  const insets = useSafeAreaInsets();
  const [scenarioId, setScenarioId] = useState(SCENARIOS[0].id);
  const [pickerOpen, setPickerOpen] = useState(false);
  // The story this board is designed for (one board per story), as on web.
  const [storyId, setStoryId] = useState<string | null>(null);
  const [storyOpen, setStoryOpen] = useState(false);
  const canvasRef = useRef<BoardCanvasHandle>(null);
  // Bumped when a different board or scenario is shown, so the canvas re-frames (saving doesn't bump it).
  const [viewKey, setViewKey] = useState(0);
  const [nodes, setNodes] = useState<BoardNode[]>([]);
  const [edges, setEdges] = useState<BoardEdge[]>([]);
  const [result, setResult] = useState<EvalResult | null>(null);
  const [inspectingEdgeId, setInspectingEdgeId] = useState<string | null>(null);
  const [savedOpen, setSavedOpen] = useState(false);
  const [talkOpen, setTalkOpen] = useState(false);
  const [scaleOpen, setScaleOpen] = useState(false);
  const [inspectingId, setInspectingId] = useState<string | null>(null);
  const [talkSections, setTalkSections] = useState<Record<string, string>>(emptyTalkTrack);
  const [talkRating, setTalkRating] = useState<number | null>(null);
  const [talkGrade, setTalkGrade] = useState<number | null>(null);
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [activeBoardTitle, setActiveBoardTitle] = useState<string | null>(null);
  // Chrome levels: full (pills + brief), compact (slim row), zen (board only,
  // translucent title overlaid on the canvas).
  const [chrome, setChrome] = useState<"full" | "compact" | "zen">("full");

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
  const liveCost = nodes.reduce((sum, node) => sum + meta(node.type).cost, 0);
  const liveMaint = nodes.reduce((sum, node) => sum + meta(node.type).maint, 0);
  const overBudget = liveCost > scenario.budget;
  const talkAnswered = scoreTalkTrack({ sections: talkSections, rating: talkRating }).answered.length;

  const clearBoard = () => {
    setNodes([]);
    setEdges([]);
    setTalkSections(emptyTalkTrack());
    setTalkRating(null);
    setTalkGrade(null);
    setResult(null);
    setActiveBoardId(null);
    setActiveBoardTitle(null);
  };

  const switchScenario = (id: string) => {
    setScenarioId(id);
    setStoryId(null);
    clearBoard();
    setViewKey((key) => key + 1);
  };

  // New nodes land in the visible part of the canvas, wherever the user has panned.
  const addNode = (type: string) => {
    const index = nodes.length;
    const origin = canvasRef.current?.visibleOrigin() ?? { x: 0, y: 0 };
    setNodes((current) => [
      ...current,
      { id: `${Date.now()}-${index}`, type, x: origin.x + 20 + (index % 2) * 150, y: origin.y + 20 + Math.floor(index / 2) * 80 },
    ]);
    setResult(null);
  };

  const moveNode = (id: string, x: number, y: number) =>
    setNodes((current) => current.map((node) => (node.id === id ? { ...node, x, y } : node)));

  const removeNode = (id: string) => {
    setNodes((current) => current.filter((node) => node.id !== id));
    setEdges((current) => current.filter((edge) => edge.from !== id && edge.to !== id));
    if (inspectingId === id) setInspectingId(null);
    setResult(null);
  };

  const patchNode = (id: string, patch: Partial<BoardNode>) => {
    setNodes((current) => current.map((node) => (node.id === id ? { ...node, ...patch } : node)));
    setResult(null);
  };

  const loadBoard = (board: SavedBoard) => {
    if (!allScenarios.some((item) => item.id === board.scenarioId)) {
      Alert.alert(t("board.unknownScenarioTitle"), t("board.unknownScenarioMessage", { scenarioId: board.scenarioId }));
      return;
    }
    setScenarioId(board.scenarioId);
    setStoryId(board.storyId ?? null);
    setViewKey((key) => key + 1);
    setNodes(board.nodes);
    setEdges(board.edges);
    setTalkSections({ ...emptyTalkTrack(), ...(board.talkTrack?.sections ?? {}) });
    setTalkRating(board.talkTrack?.rating ?? null);
    setTalkGrade(board.talkGrade ?? null);
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
  const storyCandidates = stories.filter((story) => story.scenarioId === scenario.id || story.id === storyId);
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

  const addEdge = (from: string, to: string) => {
    setEdges((current) =>
      current.some((edge) => edge.from === from && edge.to === to)
        ? current
        : [...current, { id: `${from}->${to}`, from, to }]
    );
    setResult(null);
  };

  // Tapping an arrow opens its inspector (label it, or remove it from there)
  // rather than deleting on contact.
  const removeEdge = (id: string) => {
    setEdges((current) => current.filter((edge) => edge.id !== id));
    setInspectingEdgeId(null);
    setResult(null);
  };

  const patchEdge = (id: string, patch: Partial<BoardEdge>) => {
    setEdges((current) => current.map((edge) => (edge.id === id ? { ...edge, ...patch } : edge)));
    setResult(null);
  };

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
              style={{ flexDirection: "row", alignItems: "center", gap: 8, minHeight: 44, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }}
            >
              <Text numberOfLines={1} style={{ flex: 1, fontSize: 14, fontWeight: "600", color: colors.textBright }}>{scenario.name}</Text>
              <BrandIcon name="arrowDown" color={colors.textFaint} size={12} />
            </TouchableOpacity>
            {storyCandidates.length > 0 && (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={t("board.storyLabel")}
                accessibilityValue={{ text: currentStory?.title ?? t("board.noStory") }}
                onPress={() => setStoryOpen(true)}
                style={{ flexDirection: "row", alignItems: "center", gap: 8, minHeight: 40, marginTop: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }}
              >
                <BrandIcon name="story" color={currentStory ? colors.accentBright : colors.textFaint} size={14} />
                <Text numberOfLines={1} style={{ flex: 1, fontSize: 13, fontWeight: "600", color: currentStory ? colors.text : colors.textFaint }}>
                  {currentStory?.title ?? t("board.noStory")}
                </Text>
                <BrandIcon name="arrowDown" color={colors.textFaint} size={12} />
              </TouchableOpacity>
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
      {chrome !== "zen" && <DesignTimerBar timer={timer} />}

      {chrome !== "zen" && (
        // Wraps onto a second line on narrow screens so every action stays reachable.
        <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", columnGap: 10, rowGap: 6 }}>
          <MiniButton
            label={chrome === "full" ? t("board.chromeHide") : t("board.chromeShow")}
            color={colors.textDim}
            onPress={() => setChrome(chrome === "full" ? "compact" : "full")}
          />
          <MiniButton label={t("board.zen")} color={colors.textDim} onPress={() => setChrome("zen")} />
          {chrome === "compact" && (
            <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: "600", color: colors.textDim, flexShrink: 1 }}>
              {scenario.name}
            </Text>
          )}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <BrandIcon name="cost" color={overBudget ? colors.danger : colors.textDim} size={14} />
            <Text style={{ fontSize: 12, fontWeight: "600", color: overBudget ? colors.danger : colors.textDim }}>
              {liveCost}/{scenario.budget}
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <BrandIcon name="maintenance" color={colors.textDim} size={14} />
            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textDim }}>{liveMaint}</Text>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginLeft: "auto", alignItems: "center" }}>
            <MiniButton
              label={t("scale.check")}
              color={scaleOpen ? colors.accent : colors.textDim}
              onPress={() => setScaleOpen(true)}
            />
            <MiniButton
              label={`${t("talk.title")} ${talkAnswered}/${TALK_TRACK_SECTIONS.length}`}
              color={talkOpen ? colors.accent : colors.textDim}
              onPress={() => setTalkOpen(true)}
            />
            <MiniButton label={t("board.saved")} color={savedOpen ? colors.accent : colors.textDim} onPress={() => setSavedOpen((value) => !value)} />
            <MiniButton
              label={saveBoardMutation.isPending ? t("common.saving") : t("common.save")}
              color={colors.success}
              onPress={() =>
                saveBoardMutation.mutate({
                  id: activeBoardId ?? undefined,
                  title: activeBoardTitle ?? t("board.draftTitle", { scenario: scenario.name }),
                  scenarioId: scenario.id,
                  storyId,
                  nodes,
                  edges,
                  talkTrack: { sections: talkSections, rating: talkRating },
                  talkGrade,
                })
              }
            />
            <MiniButton label={t("common.clear")} color={colors.textDim} onPress={clearBoard} />
            <Button label={t("board.evaluate")} onPress={() => setResult(evaluate(scenario, nodes, edges))} disabled={nodes.length === 0} />
          </View>
        </View>
      )}

      {boardsError && chrome !== "zen" && (
        <Text style={{ fontSize: 12, color: colors.dangerBright }}>
          {t("board.boardsError", { message: boardsError.message })}
        </Text>
      )}

      {savedOpen && chrome !== "zen" && (
        <SavedBoardsTray boards={savedBoards} scenarios={allScenarios} stories={stories} activeId={activeBoardId} onLoad={loadBoard} onDelete={confirmDeleteBoard} />
      )}

      <View style={{ flex: 1 }}>
        <BoardCanvas
          ref={canvasRef}
          fitKey={viewKey}
          nodes={nodes}
          edges={edges}
          onMoveNode={moveNode}
          onRemoveNode={removeNode}
          onAddEdge={addEdge}
          onTapEdge={setInspectingEdgeId}
          onInspectNode={(id) => setInspectingId(id)}
        />

        {chrome === "zen" && (
          <>
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                top: 8,
                left: 8,
                paddingHorizontal: 12,
                paddingVertical: 6,
                backgroundColor: `${colors.bgDeep}b8`,
                borderRadius: 16,
              }}
            >
              <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: "600", color: colors.textDim }}>
                {scenario.name} · {liveCost}/{scenario.budget}
                {timer.started ? ` · ${timer.clock}` : ""}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setChrome("compact")}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t("board.exitZen")}
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: `${colors.bgDeep}b8`,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <BrandIcon name="close" color={colors.textDim} size={14} />
            </TouchableOpacity>
          </>
        )}

        {/* Floating palette: the canvas extends underneath, so this row costs
            no layout height — translucent so the board reads through it. */}
        <View
          style={{
            position: "absolute",
            bottom: 8,
            left: 8,
            right: 8,
            backgroundColor: `${colors.bgDeep}d9`,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 12,
          }}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, padding: 6 }}>
            {NODE_TYPES.map((spec) => (
              <TouchableOpacity
                key={spec.type}
                onPress={() => addNode(spec.type)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingHorizontal: 10,
                  paddingVertical: 7,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: `${TYPE_COLORS[spec.type]}40`,
                  borderRadius: 8,
                }}
              >
                <BrandIcon name={nodeIconName(spec.type)} color={TYPE_COLORS[spec.type]} size={16} />
                <Text style={{ fontSize: 11, fontWeight: "600", color: colors.text }}>{spec.label}</Text>
                <Text style={{ fontSize: 9, color: colors.textFaint }}>{"$".repeat(spec.cost) || "free"}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
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

        <ScaleSheet key={scenario.id} visible={scaleOpen} scale={scenario.scale} onClose={() => setScaleOpen(false)} />

        <TalkTrackSheet
          visible={talkOpen}
          sections={talkSections}
          rating={talkRating}
          onChangeSection={(id, value) => {
            setTalkSections((prev) => ({ ...prev, [id]: value }));
            setTalkGrade(null);
          }}
          onChangeRating={(value) => {
            setTalkRating(value);
            setTalkGrade(null);
          }}
          onClose={() => setTalkOpen(false)}
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

        <ResultSheet
          result={result}
          scenario={scenario}
          pushback={buildPushback(scenario, nodes)}
          onClose={() => setResult(null)}
        />
      </View>
    </Screen>
  );
}

type SavedBoardsTrayProps = {
  boards: SavedBoard[];
  scenarios: Scenario[];
  stories: Story[];
  activeId: string | null;
  onLoad: (board: SavedBoard) => void;
  onDelete: (board: SavedBoard) => void;
};

function SavedBoardsTray({ boards, scenarios, stories, activeId, onLoad, onDelete }: SavedBoardsTrayProps) {
  return (
    <Animated.View entering={FadeInDown.duration(180)} style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Text style={{ flex: 1, fontSize: 12, fontWeight: "700", color: colors.textDim }}>{t("board.savedBoards")}</Text>
        <Text style={{ fontSize: 11, color: colors.textFaint }}>{t("board.savedTotal", { count: boards.length })}</Text>
      </View>
      {boards.length === 0 ? (
        <View style={{ padding: 10, backgroundColor: colors.well, borderWidth: 1, borderColor: colors.border, borderRadius: 8 }}>
          <Text style={{ fontSize: 12, color: colors.textFaint }}>{t("board.savedEmpty")}</Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 8 }}>
          {boards.map((board) => {
            const scenario = scenarios.find((item) => item.id === board.scenarioId);
            const active = board.id === activeId;
            return (
              <View
                key={board.id}
                style={{
                  width: 210,
                  padding: 10,
                  gap: 8,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: active ? colors.accent : colors.borderSoft, boxShadow: shadow.card,
                  borderRadius: 8,
                }}
              >
                <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: "700", color: colors.textBright }}>
                  {board.title}
                </Text>
                <Text numberOfLines={1} style={{ fontSize: 10.5, color: colors.textFaint }}>
                  {t("board.boardMeta", { scenario: scenario?.name ?? board.scenarioId, nodes: board.nodes.length, edges: board.edges.length })}
                </Text>
                {board.storyId && stories.some((story) => story.id === board.storyId) && (
                  <Text numberOfLines={1} style={{ fontSize: 10.5, color: colors.accentBright }}>
                    {t("board.saved.story", { title: stories.find((story) => story.id === board.storyId)?.title ?? "" })}
                  </Text>
                )}
                <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 8 }}>
                  <MiniButton label={t("common.load")} color={colors.accent} onPress={() => onLoad(board)} />
                  <MiniButton label={t("common.delete")} color={colors.danger} onPress={() => onDelete(board)} />
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </Animated.View>
  );
}
