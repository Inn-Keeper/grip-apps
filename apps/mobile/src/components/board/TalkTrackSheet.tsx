import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SELF_RATING_MAX, TALK_TRACK_SECTIONS, scoreTalkTrack } from "@grip/core/talkTrack";
import { t } from "@grip/core/i18n";
import { colors, font, tints } from "@/theme";
import { BrandIcon } from "@/components/BrandIcon";
import { Button, MiniButton } from "@/components/ui";
import type { TalkGradeResult } from "@/queries/board";

const VERDICTS = {
  covered: { color: colors.successBright, key: "talk.verdictCovered" },
  thin: { color: colors.warningBright, key: "talk.verdictThin" },
  missing: { color: colors.textFaint, key: "talk.verdictMissing" },
} as const;

type Props = {
  visible: boolean;
  sections: Record<string, string>;
  rating: number | null;
  onChangeSection: (id: string, value: string) => void;
  onChangeRating: (value: number | null) => void;
  onClose: () => void;
  grade: number | null;
  /** Already filtered by gradeState: null once the grade it belongs to is gone. */
  gradeDetail: TalkGradeResult | null;
  grading: boolean;
  gradeError: (Error & { status?: number }) | null;
  /** Why grading can't run, as text, or null when it can. */
  gradeBlocked: string | null;
  /** Null hides grading: no AI service is configured. */
  onGrade: (() => void) | null;
};

export function TalkTrackSheet({
  visible, sections, rating, onChangeSection, onChangeRating, onClose,
  grade, gradeDetail, grading, gradeError, gradeBlocked, onGrade,
}: Props) {
  if (!visible) return null;
  const { answered } = scoreTalkTrack({ sections, rating });
  const gradeColor = grade === null ? colors.textDim : grade >= 80 ? colors.successBright : grade >= 50 ? colors.warningBright : colors.dangerBright;

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
            <Text style={{ fontSize: font.size.bodyLg, fontWeight: "700", color: colors.textBright, flex: 1 }}>{t("talk.title")}</Text>
            <Text style={{ fontSize: font.size.label, fontWeight: "600", color: colors.textFaint }}>
              {t("talk.covered", { answered: answered.length, total: TALK_TRACK_SECTIONS.length })}
            </Text>
          </View>
          <Text style={{ fontSize: font.size.small, lineHeight: 17, color: colors.textFaint, marginBottom: 12 }}>
            {t("talk.intro")}
          </Text>

          <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 14, paddingBottom: 8 }}>
            {TALK_TRACK_SECTIONS.map((section) => {
              const covered = answered.includes(section.id);
              const value = sections[section.id] ?? "";
              const graded = gradeDetail?.suggestion.sections.find((item) => item.section === section.id);
              const verdict = graded ? VERDICTS[graded.verdict] : null;
              // "Missing" beside visible text reads as a contradiction; the service's floor is what happened.
              const verdictKey = graded?.verdict === "missing" && value.trim() ? "talk.verdictTooThin" : verdict?.key;
              return (
                <View key={section.id} style={{ gap: 5 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <BrandIcon
                      name={covered ? "check" : "board"}
                      color={covered ? colors.successBright : colors.textFaint}
                      size={13}
                    />
                    <Text style={{ fontSize: font.size.small, fontWeight: "700", color: colors.text, flex: 1 }}>{section.label}</Text>
                    {verdict && verdictKey && (
                      <Text style={{ fontSize: font.size.label, fontWeight: "700", color: verdict.color }}>{t(verdictKey)}</Text>
                    )}
                  </View>
                  <Text style={{ fontSize: font.size.label, lineHeight: 16, color: colors.textFaint }}>{section.hint}</Text>
                  <TextInput
                    value={value}
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
                      fontSize: font.size.smallLg,
                      lineHeight: 18,
                    }}
                  />
                  {/* The quoted span the credit was given for: the grade's evidence. */}
                  {!!graded?.evidence && (
                    <Text style={{ borderLeftWidth: 2, borderLeftColor: verdict?.color ?? colors.borderSoft, paddingLeft: 8, fontSize: font.size.label, lineHeight: 16, fontStyle: "italic", color: colors.textDim }}>
                      {`\u201C${graded.evidence}\u201D`}
                    </Text>
                  )}
                  {/* Grading by absence: what an interviewer would still ask here. */}
                  {graded && <Text style={{ fontSize: font.size.label, lineHeight: 16, color: colors.text }}>{graded.gap}</Text>}
                </View>
              );
            })}

            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: font.size.small, fontWeight: "700", color: colors.text }}>{t("talk.ratingLabel")}</Text>
              <Text style={{ fontSize: font.size.label, color: colors.textFaint }}>{t("talk.ratingHint")}</Text>
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

          {onGrade && (
            <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.borderSoft, gap: 6 }}>
              {/* A 429 is already explained by the blocked line. */}
              {gradeError && gradeError.status !== 429 && (
                <Text accessibilityRole="alert" style={{ fontSize: font.size.small, color: colors.dangerBright }}>
                  {`${t("talk.gradeFailed")}: ${gradeError.message}`}
                </Text>
              )}
              {gradeDetail?.divergence != null && gradeDetail.divergence > 0 && (
                <Text style={{ fontSize: font.size.small, color: colors.warningBright }}>
                  {t("talk.gradeDivergence", { points: gradeDetail.divergence })}
                </Text>
              )}
              {gradeDetail && (
                <Text style={{ fontSize: font.size.small, lineHeight: 17, color: colors.text }}>
                  <Text style={{ fontWeight: "700", color: colors.textDim }}>{`${t("talk.gradeFollowup")} `}</Text>
                  {gradeDetail.suggestion.hardest_followup}
                </Text>
              )}
              <Text accessibilityLiveRegion="polite" style={{ fontSize: font.size.label, lineHeight: 16, color: colors.textFaint }}>
                {gradeBlocked ?? (grade === null ? t("talk.gradeHint") : t("talk.gradeScore"))}
              </Text>
            </View>
          )}

          <View style={{ marginTop: 12, flexDirection: "row", alignItems: "center", gap: 10 }}>
            {onGrade && (
              <>
                <Button label={grading ? t("talk.grading") : t("talk.gradeAction")} onPress={onGrade} disabled={grading || gradeBlocked !== null} />
                {grading && <ActivityIndicator color={colors.accent} />}
                {grade !== null && <Text style={{ fontSize: font.size.bodyLg, fontWeight: "700", color: gradeColor }}>{grade}%</Text>}
              </>
            )}
            <View style={{ marginLeft: "auto" }}>
              {/* Grading is the main action when it exists; Close steps back. */}
              <Button label={t("common.close")} onPress={onClose} variant={onGrade ? "ghost" : "primary"} />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
