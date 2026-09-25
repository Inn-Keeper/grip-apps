import { useState } from "react";
import { Switch, Text, TouchableOpacity, View } from "react-native";
import { difficultyByKey } from "@grip/core/difficulty";
import { t } from "@grip/core/i18n";
import { AUTO_NEXT_MS } from "@grip/core/quizPrefs";
import { colors, font, shadow } from "@/theme";
import { DifficultyIcon } from "@/components/DifficultyIcon";
import { DifficultyPicker } from "@/components/DifficultyPicker";
import { QuizSizePicker } from "@/components/QuizSizePicker";

type Props = {
  level: string;
  onLevel: (key: string) => void;
  quizSize: number | null;
  poolSize: number | null;
  onQuizSize: (value: number | null) => void;
  autoNext: boolean;
  onAutoNext: (value: boolean) => void;
};

// Settings collapse to one summary row so the cards sit near the top; tap to change them.
export function PrepSettings({ level, onLevel, quizSize, poolSize, onQuizSize, autoNext, onAutoNext }: Props) {
  const [open, setOpen] = useState(false);
  const tier = difficultyByKey(level);

  return (
    <View style={{ gap: 8 }}>
      <TouchableOpacity
        onPress={() => setOpen((value) => !value)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={{
          flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 10,
          borderRadius: 10, borderWidth: 1, borderColor: colors.borderSoft, boxShadow: shadow.card, backgroundColor: colors.surface,
        }}
      >
        {tier && <DifficultyIcon tier={tier} size={15} />}
        <Text style={{ flex: 1, fontSize: font.size.smallLg, fontWeight: "700", color: colors.text }}>
          {t("prep.settingsSummary", { level: tier?.label ?? level, size: quizSize ?? "All" })}
          {autoNext ? ` · ${t("prep.autoNext")}` : ""}
        </Text>
        <Text style={{ fontSize: font.size.small, color: colors.textFaint }}>{open ? "▴" : "▾"}</Text>
      </TouchableOpacity>
      {open && (
        <>
          <DifficultyPicker level={level} onLevel={onLevel} />
          <QuizSizePicker quizSize={quizSize} poolSize={poolSize} onQuizSize={onQuizSize} />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 4 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: font.size.smallLg, fontWeight: "700", color: colors.text }}>{t("prep.autoNext")}</Text>
              <Text style={{ fontSize: font.size.label, color: colors.textFaint, marginTop: 2 }}>{t("prep.autoNextHint", { seconds: AUTO_NEXT_MS / 1000 })}</Text>
            </View>
            <Switch
              value={autoNext}
              onValueChange={onAutoNext}
              accessibilityLabel={t("prep.autoNext")}
              trackColor={{ true: colors.accent, false: colors.border }}
            />
          </View>
        </>
      )}
    </View>
  );
}
