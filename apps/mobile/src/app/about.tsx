import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { t } from "@grip/core/i18n";
import { useLocale } from "@/lib/useLocale";
import { alpha, font, radius, space, useTheme } from "@/theme";
import { BrandIcon } from "@/components/BrandIcon";

type TKey = Parameters<typeof t>[0];

type Feature = {
  icon: "layers" | "story" | "board" | "contact" | "rank";
  color: "deco2" | "deco3" | "deco5" | "deco6" | "deco7"; // token key, resolved per theme
  titleKey: TKey;
  taglineKey: TKey;
  bulletKeys: TKey[];
};

const FEATURES: Feature[] = [
  {
    icon: "layers",
    color: "deco7",
    titleKey: "about.prep.title",
    taglineKey: "about.prep.tagline",
    bulletKeys: ["about.prep.b1", "about.prep.b2", "about.prep.b3", "about.prep.b4", "about.prep.b5", "about.prep.b6"],
  },
  {
    icon: "story",
    color: "deco2",
    titleKey: "about.stories.title",
    taglineKey: "about.stories.tagline",
    bulletKeys: ["about.stories.b1", "about.stories.b2", "about.stories.b3", "about.stories.b4", "about.stories.b5"],
  },
  {
    icon: "board",
    color: "deco3",
    titleKey: "about.board.title",
    taglineKey: "about.board.tagline",
    bulletKeys: ["about.board.b1", "about.board.b2", "about.board.b3", "about.board.b4", "about.board.b5"],
  },
  {
    icon: "contact",
    color: "deco5",
    titleKey: "about.quest.title",
    taglineKey: "about.quest.tagline",
    bulletKeys: ["about.quest.b1", "about.quest.b2", "about.quest.b3", "about.quest.b4", "about.quest.b5"],
  },
  {
    icon: "rank",
    color: "deco6",
    titleKey: "about.profile.title",
    taglineKey: "about.profile.tagline",
    bulletKeys: ["about.profile.b1", "about.profile.b2", "about.profile.b3", "about.profile.b4", "about.profile.b5"],
  },
];

const HOW_IT_WORKS: { labelKey: TKey; detailKey: TKey }[] = [
  { labelKey: "about.how.syncedLabel", detailKey: "about.how.syncedDetail" },
  { labelKey: "about.how.offlineLabel", detailKey: "about.how.offlineDetail" },
  { labelKey: "about.how.adaptiveLabel", detailKey: "about.how.adaptiveDetail" },
  { labelKey: "about.how.privateLabel", detailKey: "about.how.privateDetail" },
];

export default function AboutScreen() {
  const { colors, shadow } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const locale = useLocale();

  return (
    <View key={locale} style={{
        flex: 1,
        backgroundColor: colors.bg,
        paddingTop: insets.top
      }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: space.sm,
          paddingHorizontal: space.lg,
          paddingVertical: space.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{
            padding: 4,
            marginLeft: -4
          }}>
          <Text style={{
              color: colors.accentBright,
              fontSize: font.size.headingLg,
              lineHeight: 24,
              fontWeight: "300"
            }}>‹</Text>
        </TouchableOpacity>
        <Text style={{
            color: colors.textBright,
            fontSize: font.size.title,
            fontWeight: "700",
            flex: 1
          }}>
          {t("about.title")}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: space.lg, gap: space.md, paddingBottom: insets.bottom + 48 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{
            color: colors.textFaint,
            fontSize: font.size.body,
            lineHeight: 20
          }}>
          {t("about.intro")}
        </Text>

        {FEATURES.map((f) => (
          <View
            key={f.titleKey}
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.borderSoft,
              boxShadow: shadow.card,
              borderRadius: radius.md,
              padding: space.lg,
              gap: space.sm,
            }}
          >
            <View style={{
                flexDirection: "row",
                alignItems: "center",
                gap: space.sm
              }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: radius.sm,
                  backgroundColor: alpha(colors[f.color], 0.09),
                  borderWidth: 1,
                  borderColor: alpha(colors[f.color], 0.19),
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <BrandIcon name={f.icon} color={colors[f.color]} size={18} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                    color: colors.textBright,
                    fontSize: font.size.body,
                    fontWeight: "700"
                  }}>{t(f.titleKey)}</Text>
                <Text style={{
                    color: colors.textFaint,
                    fontSize: font.size.small,
                    marginTop: 1
                  }}>{t(f.taglineKey)}</Text>
              </View>
            </View>
            <View style={{
                gap: 4,
                paddingLeft: 4
              }}>
              {f.bulletKeys.map((b) => (
                <Text key={b} style={{
                    color: colors.textDim,
                    fontSize: font.size.small,
                    lineHeight: 18
                  }}>
                  · {t(b)}
                </Text>
              ))}
            </View>
          </View>
        ))}

        <View
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.borderSoft,
            boxShadow: shadow.card,
            borderRadius: radius.md,
            padding: space.lg,
            gap: space.md,
          }}
        >
          <Text style={{
              color: colors.textBright,
              fontSize: font.size.body,
              fontWeight: "700"
            }}>{t("about.howItWorks")}</Text>
          <View style={{ gap: space.sm }}>
            {HOW_IT_WORKS.map((item) => (
              <View key={item.labelKey}>
                <Text style={{
                    color: colors.accent,
                    fontSize: font.size.small,
                    fontWeight: "700",
                    marginBottom: 2
                  }}>
                  {t(item.labelKey)}
                </Text>
                <Text style={{
                    color: colors.textDim,
                    fontSize: font.size.small,
                    lineHeight: 18
                  }}>{t(item.detailKey)}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
