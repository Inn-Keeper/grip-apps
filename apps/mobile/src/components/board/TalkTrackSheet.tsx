import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SELF_RATING_MAX, TALK_TRACK_SECTIONS, scoreTalkTrack } from "@grip/core/talkTrack";
import { t } from "@grip/core/i18n";
import { colors, tints } from "@/theme";
import { BrandIcon } from "@/components/BrandIcon";
import { Button, MiniButton } from "@/components/ui";

type Props = {
  visible: boolean;
  sections: Record<string, string>;
  rating: number | null;
  onChangeSection: (id: string, value: string) => void;
  onChangeRating: (value: number | null) => void;
  onClose: () => void;
};

export function TalkTrackSheet({ visible, sections, rating, onChangeSection, onChangeRating, onClose }: Props) {
  if (!visible) return null;
  const { answered } = scoreTalkTrack({ sections, rating });

  return (
    // Modal's native slide animation — matches ResultSheet.
    <Modal transparent animationType="slide" visible onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: tints.modalScrim }} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View
          style={{
            maxHeight: "85%",
            backgroundColor: colors.surface,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            borderWidth: 1,
            borderColor: colors.borderSoft,
            padding: 20,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <BrandIcon name="spark" color={colors.accentBright} size={16} />
            <Text style={{ fontSize: 15, fontWeight: "700", color: colors.textBright, flex: 1 }}>{t("talk.title")}</Text>
            <Text style={{ fontSize: 11, fontWeight: "600", color: colors.textFaint }}>
              {t("talk.covered", { answered: answered.length, total: TALK_TRACK_SECTIONS.length })}
            </Text>
          </View>
          <Text style={{ fontSize: 12, lineHeight: 17, color: colors.textFaint, marginBottom: 12 }}>
            {t("talk.intro")}
          </Text>

          <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 14, paddingBottom: 8 }}>
            {TALK_TRACK_SECTIONS.map((section) => {
              const covered = answered.includes(section.id);
              return (
                <View key={section.id} style={{ gap: 5 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <BrandIcon
                      name={covered ? "check" : "board"}
                      color={covered ? colors.successBright : colors.textFaint}
                      size={13}
                    />
                    <Text style={{ fontSize: 12, fontWeight: "700", color: colors.text }}>{section.label}</Text>
                  </View>
                  <Text style={{ fontSize: 11, lineHeight: 16, color: colors.textFaint }}>{section.hint}</Text>
                  <TextInput
                    value={sections[section.id] ?? ""}
                    onChangeText={(value) => onChangeSection(section.id, value)}
                    multiline
                    textAlignVertical="top"
                    style={{
                      minHeight: 76,
                      padding: 10,
                      backgroundColor: colors.bgDeep,
                      borderWidth: 1,
                      borderColor: covered ? `${colors.success}55` : colors.border,
                      borderRadius: 8,
                      color: colors.text,
                      fontSize: 12.5,
                      lineHeight: 18,
                    }}
                  />
                </View>
              );
            })}

            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: colors.text }}>{t("talk.ratingLabel")}</Text>
              <Text style={{ fontSize: 11, color: colors.textFaint }}>{t("talk.ratingHint")}</Text>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
                {Array.from({ length: SELF_RATING_MAX }, (_, i) => i + 1).map((value) => (
                  <MiniButton
                    key={value}
                    label={String(value)}
                    color={rating === value ? colors.accent : colors.textDim}
                    onPress={() => onChangeRating(rating === value ? null : value)}
                  />
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={{ marginTop: 12, alignItems: "flex-end" }}>
            <Button label={t("common.close")} onPress={onClose} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
