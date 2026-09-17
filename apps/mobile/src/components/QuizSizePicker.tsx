import { Text, TouchableOpacity, View } from "react-native";
import { normalizeQuizSize, QUIZ_SIZE_OPTIONS } from "@grip/core/quizPrefs";
import { colors } from "@/theme";
import { BrandIcon } from "@/components/BrandIcon";

type Props = {
  quizSize: number | null;
  poolSize: number | null;
  onQuizSize: (value: number | null) => void;
};

export function QuizSizePicker({ quizSize, poolSize, onQuizSize }: Props) {
  const detail =
    poolSize === null
      ? "Open a card to count."
      : quizSize === null
        ? `All = ${poolSize} on last card`
        : `Last card: ${poolSize} found`;

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: 12,
        gap: 10,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <BrandIcon name="layers" color={colors.accentBright} size={15} />
          <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textDim, letterSpacing: 0.6 }}>QUESTIONS</Text>
        </View>
        <Text style={{ flex: 1, textAlign: "right", fontSize: 10.5, color: colors.textFaint }} numberOfLines={1}>
          {detail}
        </Text>
      </View>

      <View style={{ flexDirection: "row", gap: 6 }}>
        {QUIZ_SIZE_OPTIONS.map((option) => {
          const active = quizSize === option.value;
          const disabled = typeof option.value === "number" && poolSize !== null && option.value > poolSize;
          return (
            <TouchableOpacity
              key={option.label}
              onPress={() => onQuizSize(normalizeQuizSize(option.value))}
              accessibilityState={{ selected: active, disabled }}
              style={{
                flex: 1,
                alignItems: "center",
                paddingVertical: 8,
                borderRadius: 10,
                backgroundColor: active ? `${colors.accent}24` : colors.well,
                borderWidth: 1,
                borderColor: active ? colors.accent : colors.border,
                opacity: disabled && !active ? 0.55 : 1,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "800", color: active ? colors.accentBright : colors.textDim }}>{option.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
