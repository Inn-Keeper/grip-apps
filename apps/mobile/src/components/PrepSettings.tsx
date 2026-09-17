import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { difficultyByKey } from "@grip/core/difficulty";
import { t } from "@grip/core/i18n";
import { colors } from "@/theme";
import { DifficultyIcon } from "@/components/DifficultyIcon";
import { DifficultyPicker } from "@/components/DifficultyPicker";
import { QuizSizePicker } from "@/components/QuizSizePicker";

type Props = {
  level: string;
  onLevel: (key: string) => void;
  quizSize: number | null;
  poolSize: number | null;
  onQuizSize: (value: number | null) => void;
};

// Settings collapse to one summary row so the cards sit near the top; tap to change them.
export function PrepSettings({ level, onLevel, quizSize, poolSize, onQuizSize }: Props) {
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
          borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
        }}
      >
        {tier && <DifficultyIcon tier={tier} size={15} />}
        <Text style={{ flex: 1, fontSize: 12.5, fontWeight: "700", color: colors.text }}>
          {t("prep.settingsSummary", { level: tier?.label ?? level, size: quizSize ?? "All" })}
        </Text>
        <Text style={{ fontSize: 12, color: colors.textFaint }}>{open ? "▴" : "▾"}</Text>
      </TouchableOpacity>
      {open && (
        <>
          <DifficultyPicker level={level} onLevel={onLevel} />
          <QuizSizePicker quizSize={quizSize} poolSize={poolSize} onQuizSize={onQuizSize} />
        </>
      )}
    </View>
  );
}
