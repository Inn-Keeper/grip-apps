import { useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { ESTIMATE_TARGETS, deriveScale, formatCompact, gradeEstimate } from "@grip-apps/core/estimation";
import { t } from "@grip-apps/core/i18n";
import { colors, tints } from "@/theme";
import { BrandIcon } from "@/components/BrandIcon";
import { Button } from "@/components/ui";

const DAYS_PER_YEAR = 365;

const formatRetention = (days: number) =>
  days >= DAYS_PER_YEAR
    ? t("scale.years", { count: Math.round((days / DAYS_PER_YEAR) * 10) / 10 })
    : t("scale.days", { count: days });

type Scale = {
  dau: number;
  actionsPerUserPerDay: number;
  writesPerUserPerDay: number;
  payloadKb: number;
  retentionDays: number;
};

type Props = { visible: boolean; scale: Scale | undefined; onClose: () => void };

export function ScaleSheet({ visible, scale, onClose }: Props) {
  const [guesses, setGuesses] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);

  if (!visible || !scale) return null;
  const derived = deriveScale(scale);
  const givens = [
    { label: t("scale.dauLabel"), value: formatCompact(scale.dau) },
    { label: t("scale.actionsLabel"), value: formatCompact(scale.actionsPerUserPerDay) },
    { label: t("scale.writesLabel"), value: formatCompact(scale.writesPerUserPerDay) },
    { label: t("scale.payloadLabel"), value: `${formatCompact(scale.payloadKb)} KB` },
    { label: t("scale.retentionLabel"), value: formatRetention(scale.retentionDays) },
  ];

  return (
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
            borderColor: colors.border,
            padding: 20,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <BrandIcon name="accuracy" color={colors.accentBright} size={16} />
            <Text style={{ fontSize: 15, fontWeight: "700", color: colors.textBright, flex: 1 }}>{t("scale.title")}</Text>
          </View>
          <Text style={{ fontSize: 12, color: colors.textFaint, marginBottom: 12 }}>{t("scale.subtitle")}</Text>

          <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 14, paddingBottom: 8 }}>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14 }}>
              {givens.map((given) => (
                <View key={given.label} style={{ gap: 2 }}>
                  <Text style={{ fontSize: 10, fontWeight: "700", color: colors.textFaint }}>
                    {given.label.toUpperCase()}
                  </Text>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>{given.value}</Text>
                </View>
              ))}
            </View>

            {ESTIMATE_TARGETS.map((target) => {
              const actual = target.valueOf(derived);
              const grade = checked ? gradeEstimate(actual, guesses[target.id]) : null;
              const bandColor = !grade?.band
                ? colors.border
                : grade.band === "off"
                  ? colors.dangerBright
                  : colors.successBright;
              return (
                <View key={target.id} style={{ gap: 5 }}>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: colors.text }}>
                    {target.label} ({target.unit})
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textFaint }}>{target.hint}</Text>
                  <TextInput
                    value={guesses[target.id] ?? ""}
                    onChangeText={(value) => {
                      setGuesses((prev) => ({ ...prev, [target.id]: value }));
                      setChecked(false);
                    }}
                    keyboardType="numeric"
                    placeholder={t("scale.placeholder")}
                    placeholderTextColor={colors.textFaint}
                    style={{
                      padding: 10,
                      backgroundColor: colors.bgDeep,
                      borderWidth: 1,
                      borderColor: bandColor,
                      borderRadius: 8,
                      color: colors.text,
                      fontSize: 13,
                    }}
                  />
                  {grade?.band && grade.ratio !== null && (
                    <Text style={{ fontSize: 11.5, color: bandColor }}>
                      {t(`scale.band${grade.band === "close" ? "Close" : grade.band === "order" ? "Order" : "Off"}`)}
                      {" — "}
                      {t("scale.actual", { value: formatCompact(Math.round(actual)) })}{" "}
                      {grade.ratio >= 1
                        ? t("scale.ratioHigh", { ratio: formatCompact(Math.round(grade.ratio * 10) / 10) })
                        : t("scale.ratioLow", { ratio: formatCompact(Math.round((1 / grade.ratio) * 10) / 10) })}
                    </Text>
                  )}
                </View>
              );
            })}
          </ScrollView>

          <View style={{ marginTop: 12, flexDirection: "row", justifyContent: "flex-end", gap: 8 }}>
            <Button label={t("scale.check")} onPress={() => setChecked(true)} />
            <Button label={t("common.close")} onPress={onClose} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
