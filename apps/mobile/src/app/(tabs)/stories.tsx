import { useState } from "react";
import { Alert, FlatList, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { COMPETENCIES, COMPETENCY_COLORS, PROMPTS } from "@grip/core/stories";
import { t } from "@grip/core/i18n";
import { useLocale } from "@/lib/useLocale";
import { colors, layout } from "@/theme";
import { BrandIcon } from "@/components/BrandIcon";
import { Badge, Button, Field, HeaderAction, MiniButton, Pill, Screen, ScreenHeader, Section, SegmentedPills, inputStyle, multilineStyle } from "@/components/ui";
import type { Story } from "@grip/core/api";
import { useDeleteStoryMutation, useSaveStoryMutation, useStoriesQuery } from "@/queries/stories";

const EMPTY_FORM: Story = { title: "", competency: "Conflict", situation: "", task: "", action: "", result: "" };

export default function StoriesScreen() {
  const locale = useLocale();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<"stories" | "drill">("stories");
  const [editing, setEditing] = useState<Story | null>(null);

  const { data: stories, error } = useStoriesQuery();
  const saveMutation = useSaveStoryMutation();
  const deleteMutation = useDeleteStoryMutation();

  const confirmDelete = (story: Story) =>
    Alert.alert(t("stories.deleteTitle"), t("stories.deleteMessage", { title: story.title }), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("common.delete"), style: "destructive", onPress: () => deleteMutation.mutate(story.id) },
    ]);

  const handleSave = (form: Story) => {
    if (form.title.trim()) saveMutation.mutate(form);
    setEditing(null);
  };

  if (editing) {
    return (
      <Screen key={locale}>
        <StoryForm initial={editing} onSave={handleSave} onCancel={() => setEditing(null)} />
      </Screen>
    );
  }

  return (
    <Screen key={locale}>
      <ScreenHeader
        title={t("tabs.stories")}
        subtitle={t("screen.storiesSubtitle")}
        right={<HeaderAction icon="story" label={t("stories.addStory")} onPress={() => setEditing(EMPTY_FORM)} />}
      >
        <SegmentedPills
          options={[
            { key: "stories", label: t("stories.myStories"), icon: "story" },
            { key: "drill", label: t("stories.drillPrompts"), icon: "prompt" },
          ]}
          activeKey={mode}
          onChange={(key) => setMode(key as "stories" | "drill")}
        />
      </ScreenHeader>
      <FlatList
        data={mode === "stories" ? (stories ?? []) : []}
        keyExtractor={(story) => story.id!}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + layout.tabBarClearance }}
        ListHeaderComponent={
          <View style={{ gap: 12 }}>
            {error && <Text style={{ color: colors.dangerBright, fontSize: 13 }}>{t("stories.loadError", { message: error.message })}</Text>}

            {mode === "drill" && <PromptDrill stories={stories ?? []} />}

            {mode === "stories" && stories?.length === 0 && (
              <Text style={{ color: colors.textFaint, fontSize: 13, textAlign: "center", marginTop: 16 }}>
                {t("stories.empty")}
              </Text>
            )}
          </View>
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(Math.min(index * 50, 250)).springify().damping(18)}>
            <StoryCard story={item} onEdit={() => setEditing(item)} onDelete={() => confirmDelete(item)} />
          </Animated.View>
        )}
      />
    </Screen>
  );
}

type StoryCardProps = { story: Story; onEdit?: () => void; onDelete?: () => void };

function StoryCard({ story, onEdit, onDelete }: StoryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const color = COMPETENCY_COLORS[story.competency] ?? colors.textFaint;

  return (
    <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: `${color}30`, borderRadius: 14, padding: 16 }}>
      <TouchableOpacity
        onPress={() => setExpanded((value) => !value)}
        style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
      >
        <Badge label={t(`enum.competency.${story.competency}` as Parameters<typeof t>[0])} color={color} />
        <Text style={{ flex: 1, color: colors.textBright, fontSize: 14, fontWeight: "600" }}>{story.title}</Text>
        <BrandIcon name={expanded ? "arrowUp" : "arrowDown"} color={colors.textFaint} size={13} />
      </TouchableOpacity>

      {expanded && (
        <View style={{ marginTop: 12, gap: 10 }}>
          <Section label={t("stories.situation")} text={story.situation} />
          <Section label={t("stories.task")} text={story.task} />
          <Section label={t("stories.action")} text={story.action} />
          <Section label={t("stories.result")} text={story.result} />
          {onEdit && onDelete && (
            <View style={{ flexDirection: "row", gap: 8, justifyContent: "flex-end" }}>
              <MiniButton label={t("common.edit")} color={colors.textDim} onPress={onEdit} />
              <MiniButton label={t("common.delete")} color={colors.danger} onPress={onDelete} />
            </View>
          )}
        </View>
      )}
    </View>
  );
}

type StoryFormProps = { initial: Story; onSave: (story: Story) => void; onCancel: () => void };

function StoryForm({ initial, onSave, onCancel }: StoryFormProps) {
  const [form, setForm] = useState({ ...initial });
  const insets = useSafeAreaInsets();
  const set = (field: keyof Story) => (value: string) => setForm((current) => ({ ...current, [field]: value }));

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: insets.bottom + layout.tabBarClearance }}
      keyboardShouldPersistTaps="handled"
    >
      <Field label={t("stories.fieldTitle")}>
        <TextInput style={inputStyle} value={form.title} onChangeText={set("title")} autoFocus />
      </Field>
      <Field label={t("stories.fieldCompetency")}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {COMPETENCIES.map((competency: string) => (
            <Pill
              key={competency}
              label={t(`enum.competency.${competency}` as Parameters<typeof t>[0])}
              active={form.competency === competency}
              activeColor={COMPETENCY_COLORS[competency]}
              onPress={() => set("competency")(competency)}
            />
          ))}
        </View>
      </Field>
      <Field label={t("stories.fieldSituation")}>
        <TextInput style={[inputStyle, multilineStyle]} value={form.situation} onChangeText={set("situation")} multiline />
      </Field>
      <Field label={t("stories.fieldTask")}>
        <TextInput style={[inputStyle, multilineStyle]} value={form.task} onChangeText={set("task")} multiline />
      </Field>
      <Field label={t("stories.fieldAction")}>
        <TextInput style={[inputStyle, multilineStyle]} value={form.action} onChangeText={set("action")} multiline />
      </Field>
      <Field label={t("stories.fieldResult")}>
        <TextInput style={[inputStyle, multilineStyle]} value={form.result} onChangeText={set("result")} multiline />
      </Field>

      <View style={{ flexDirection: "row", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
        <Button label={t("common.cancel")} variant="ghost" onPress={onCancel} />
        <Button label={t("common.save")} onPress={() => onSave(form)} disabled={!form.title.trim()} />
      </View>
    </ScrollView>
  );
}

function PromptDrill({ stories }: { stories: Story[] }) {
  const [promptIndex, setPromptIndex] = useState(() => Math.floor(Math.random() * PROMPTS.length));
  const [revealed, setRevealed] = useState(false);

  const prompt = PROMPTS[promptIndex];
  const matching = stories.filter((story) => story.competency === prompt.competency);

  const nextPrompt = () => {
    let next = Math.floor(Math.random() * PROMPTS.length);
    if (next === promptIndex) next = (next + 1) % PROMPTS.length;
    setPromptIndex(next);
    setRevealed(false);
  };

  return (
    <View style={{ gap: 12 }}>
      <Animated.View
        key={promptIndex}
        entering={FadeInDown.springify().damping(16)}
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 14,
          padding: 20,
          alignItems: "center",
          gap: 10,
        }}
      >
        <Badge label={t(`enum.competency.${prompt.competency}` as Parameters<typeof t>[0])} color={COMPETENCY_COLORS[prompt.competency]} />
        <Text style={{ color: colors.textBright, fontSize: 16, fontWeight: "600", lineHeight: 23, textAlign: "center" }}>
          "{prompt.text}"
        </Text>
        <Text style={{ color: colors.textFaint, fontSize: 12, textAlign: "center" }}>
          {t("stories.answerOutLoud")}
        </Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Button label={t("stories.reveal")} onPress={() => setRevealed(true)} disabled={revealed} />
          <Button label={t("stories.nextPrompt")} variant="ghost" onPress={nextPrompt} />
        </View>
      </Animated.View>

      {revealed &&
        (matching.length === 0 ? (
          <Text style={{ color: colors.warningBright, fontSize: 13, textAlign: "center" }}>
            {t("stories.noStoryFor", { competency: t(`enum.competency.${prompt.competency}` as Parameters<typeof t>[0]) })}
          </Text>
        ) : (
          matching.map((story) => <StoryCard key={story.id} story={story} />)
        ))}
    </View>
  );
}
