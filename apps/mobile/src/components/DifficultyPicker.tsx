import { Text, TouchableOpacity, View } from "react-native";
import { DIFFICULTIES, difficultyByKey } from "@grip-apps/core/difficulty";
import { t } from "@grip-apps/core/i18n";
import { colors } from "@/theme";
import { DifficultyIcon } from "@/components/DifficultyIcon";

type Props = {
  level: string;
  onLevel: (key: string) => void;
};

// Persistent, sassy difficulty selector. The chosen tier drives both the quiz
// cards and the drill, so the whole screen runs at one level.
export function DifficultyPicker({ level, onLevel }: Props) {
  const tier = difficultyByKey(level);
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: 12,
        gap: 8,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textDim, letterSpacing: 0.6 }}>DIFFICULTY</Text>
        {tier && <Text style={{ fontSize: 10.5, color: colors.textFaint }}>{t(tier.blurbKey as Parameters<typeof t>[0])}</Text>}
      </View>
      <View style={{ flexDirection: "row", gap: 6 }}>
        {DIFFICULTIES.map((d) => {
          const active = d.key === level;
          return (
            <TouchableOpacity
              key={d.key}
              onPress={() => onLevel(d.key)}
              accessibilityState={{ selected: active }}
              style={{
                flex: 1,
                alignItems: "center",
                paddingVertical: 8,
                borderRadius: 10,
                backgroundColor: active ? `${d.color}24` : colors.well,
                borderWidth: 1,
                borderColor: active ? d.color : colors.border,
              }}
            >
              <DifficultyIcon tier={d} size={19} />
              <Text style={{ fontSize: 9.5, fontWeight: "700", color: active ? d.color : colors.textDim, marginTop: 2 }} numberOfLines={1}>
                {d.label}
              </Text>
              <Text style={{ fontSize: 8.5, fontWeight: "700", color: active ? d.color : colors.textFaint, marginTop: 1 }}>+{d.xp}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
