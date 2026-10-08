import { Text, TouchableOpacity, View } from "react-native";
import type { User } from "@grip/core/api";
import { t } from "@grip/core/i18n";
import { categories } from "@grip/core/prepData";
import { toggleFavoriteTech } from "@grip/core/user";
import { colors, font, radius, space, tints } from "@/theme";
import { Card } from "@/components/ui";
import { useSaveFavoriteTechsMutation } from "@/queries/profile";

// Every Prep tech, alphabetical like the web picker.
const TECHS = categories
  .flatMap((c) => c.items.map((item) => item.tech))
  .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

// Toggle chips for the profile's favorite techs; they feed Prep's From My Favorites category.
export function FavoriteTechsCard({ profile }: { profile: User | null }) {
  const mutation = useSaveFavoriteTechsMutation();
  const favorites = profile?.favoriteTechs ?? [];
  // Blocks taps mid-save so a toggle never starts from a stale list.
  const disabled = !profile || mutation.isPending;

  return (
    <Card>
      <Text style={{
          color: colors.textBright,
          fontSize: font.size.title,
          fontWeight: "800"
        }}>{t("profile.favoriteTechs")}</Text>
      <Text style={{
          color: colors.textFaint,
          fontSize: font.size.small,
          lineHeight: 18
        }}>{t("profile.favoriteTechsBlurb")}</Text>
      <View style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: space.sm
        }}>
        {TECHS.map((tech) => {
          const selected = favorites.includes(tech);
          return (
            <TouchableOpacity
              key={tech}
              accessibilityRole="button"
              accessibilityState={{ selected, disabled }}
              disabled={disabled}
              onPress={() => mutation.mutate(toggleFavoriteTech(favorites, tech))}
              style={{
                minHeight: 44,
                justifyContent: "center",
                paddingHorizontal: space.md,
                borderRadius: radius.pill,
                backgroundColor: selected ? tints.accentSoft : "transparent",
                borderWidth: 1,
                borderStyle: selected ? "solid" : "dashed",
                borderColor: selected ? colors.accent : colors.border,
              }}
            >
              <Text style={{
                  color: selected ? colors.accentBright : colors.textDim,
                  fontSize: font.size.small,
                  fontWeight: selected ? "700" : "400"
                }}>{tech}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {mutation.error && (
        <Text style={{
            color: colors.dangerBright,
            fontSize: font.size.small
          }}>{mutation.error.message}</Text>
      )}
    </Card>
  );
}
