import { Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from "react-native";
import type { Story } from "@grip/core/api";
import { COMPETENCY_COLORS } from "@grip/core/stories";
import { t } from "@grip/core/i18n";
import { colors, tints } from "@/theme";
import { BrandIcon } from "@/components/BrandIcon";
import { Badge, Section } from "@/components/ui";

type Props = {
  visible: boolean;
  candidates: Story[];
  current: Story | undefined;
  /** Stories another board already holds (one board per story). */
  taken: Set<string | null | undefined>;
  onPick: (storyId: string | null) => void;
  onClose: () => void;
};

// The story this board is designed for, like the web rail's picker: its STAR on top,
// then the stories linked to the scenario (or none). Taken stories show but can't be picked.
export function StorySheet({ visible, candidates, current, taken, onPick, onClose }: Props) {
  const options: { id: string | null; label: string; disabled: boolean }[] = [
    { id: null, label: t("board.noStory"), disabled: false },
    ...candidates.map((story) => {
      const disabled = taken.has(story.id);
      return { id: story.id ?? null, label: disabled ? t("board.storyTaken", { title: story.title }) : story.title, disabled };
    }),
  ];

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: tints.modalScrim }} accessibilityLabel={t("common.close")} />
      <View
        style={{
          maxHeight: "80%",
          backgroundColor: colors.surface,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          borderWidth: 1,
          borderColor: colors.borderSoft,
          padding: 16,
          gap: 10,
        }}
      >
        <Text style={{ fontSize: 15, fontWeight: "700", color: colors.textBright }}>{t("board.storyLabel")}</Text>
        <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 12, paddingBottom: 12 }}>
          {current && (
            <View style={{ gap: 8, padding: 12, borderRadius: 10, backgroundColor: colors.bgDeep, borderWidth: 1, borderColor: colors.borderSoft }}>
              <Badge label={t(`enum.competency.${current.competency}` as Parameters<typeof t>[0])} color={COMPETENCY_COLORS[current.competency] ?? colors.textFaint} />
              <Section label={t("stories.situation")} text={current.situation} />
              <Section label={t("stories.task")} text={current.task} />
              <Section label={t("stories.action")} text={current.action} />
              <Section label={t("stories.result")} text={current.result} />
            </View>
          )}
          <View>
            {options.map((option) => {
              const active = option.id === (current?.id ?? null);
              return (
                <TouchableOpacity
                  key={option.id ?? "none"}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active, disabled: option.disabled }}
                  disabled={option.disabled}
                  onPress={() => {
                    onPick(option.id);
                    onClose();
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    minHeight: 44,
                    paddingHorizontal: 10,
                    borderRadius: 8,
                    opacity: option.disabled ? 0.5 : 1,
                    backgroundColor: active ? tints.accentSoft : "transparent",
                  }}
                >
                  <Text numberOfLines={1} style={{ flex: 1, fontSize: 14, fontWeight: active ? "700" : "500", color: active ? colors.accentBright : colors.text }}>
                    {option.label}
                  </Text>
                  {active && <BrandIcon name="check" color={colors.accentBright} size={14} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
