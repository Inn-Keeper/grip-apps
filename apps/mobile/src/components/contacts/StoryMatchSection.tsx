import { useState } from "react";
import { Text, View } from "react-native";
import { groupStoriesByCompetency } from "@grip/core/stories";
import { colors, font } from "@/theme";
import { MiniButton } from "@/components/ui";

export type StoryItem = { id?: string; title: string; competency: string };

export function StoryMatchSection({ stories }: { stories: StoryItem[] }) {
  const [open, setOpen] = useState(false);
  const grouped = groupStoriesByCompetency(stories);
  const covered = grouped.filter((g) => g.stories.length > 0);
  const gaps = grouped.filter((g) => g.stories.length === 0);

  return (
    <View style={{ marginTop: 8 }}>
      <MiniButton
        label={`Prep stories (${covered.length}/${grouped.length})`}
        color={colors.textDim}
        onPress={() => setOpen((v) => !v)}
      />
      {open && (
        <View
          style={{
            marginTop: 6,
            padding: 10,
            backgroundColor: colors.well,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 8,
            gap: 8,
          }}
        >
          {covered.map((g) => (
            <View key={g.competency} style={{ gap: 3 }}>
              <View
                style={{
                  alignSelf: "flex-start",
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  backgroundColor: `${g.color}20`,
                  borderRadius: 12,
                }}
              >
                <Text style={{ fontSize: font.size.caption, fontWeight: "700", color: g.color, letterSpacing: 0.5 }}>
                  {g.competency.toUpperCase()}
                </Text>
              </View>
              {g.stories.map((s) => (
                <Text key={s.id ?? s.title} style={{ fontSize: font.size.small, color: colors.text, paddingLeft: 4 }}>
                  · {s.title}
                </Text>
              ))}
            </View>
          ))}
          {gaps.length > 0 && (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
              {gaps.map((g) => (
                <View
                  key={g.competency}
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    backgroundColor: `${colors.textFaint}15`,
                    borderRadius: 12,
                  }}
                >
                  <Text style={{ fontSize: font.size.caption, fontWeight: "600", color: colors.textFaint }}>
                    {g.competency} · no story
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}
