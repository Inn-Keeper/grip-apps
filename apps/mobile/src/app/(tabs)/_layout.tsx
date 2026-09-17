import { NativeTabs } from "expo-router/unstable-native-tabs";
import { t } from "@grip/core/i18n";
import { useTabBarHidden } from "@/lib/uiStore";
import { useLocale } from "@/lib/useLocale";
import { colors } from "@/theme";

const { Icon, Label } = NativeTabs.Trigger;
const tabChrome = `${colors.bgDeep}E6`;

// True native tab bar (UITabBarController on iOS — Liquid Glass on current
// versions, native bottom navigation on Android) instead of JS-rendered tabs.
// The Arch Board's zen mode hides it for an edge-to-edge canvas.
export default function TabLayout() {
  const locale = useLocale();
  const hidden = useTabBarHidden();

  return (
    <NativeTabs
      key={locale}
      hidden={hidden}
      tintColor={colors.accent}
      backgroundColor={tabChrome}
      blurEffect="systemUltraThinMaterialDark"
      shadowColor={`${colors.border}CC`}
      iconColor={{ default: colors.textFaint, selected: colors.accentBright }}
      labelStyle={{
        default: { color: colors.textFaint, fontSize: 11, fontWeight: "700" },
        selected: { color: colors.accentBright, fontSize: 11, fontWeight: "800" },
      }}
      indicatorColor={colors.accent}
      rippleColor={`${colors.accent}22`}
      disableTransparentOnScrollEdge
    >
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "book", selected: "book.fill" }} />
        <Label>{t("tabs.prep")}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="stories">
        <Icon sf={{ default: "star", selected: "star.fill" }} />
        <Label>{t("tabs.stories")}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="board">
        <Icon sf={{ default: "square.grid.2x2", selected: "square.grid.2x2.fill" }} />
        <Label>{t("tabs.board")}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="quest">
        <Icon sf={{ default: "map", selected: "map.fill" }} />
        <Label>{t("tabs.quest")}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: "person.crop.circle", selected: "person.crop.circle.fill" }} />
        <Label>{t("tabs.profile")}</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
