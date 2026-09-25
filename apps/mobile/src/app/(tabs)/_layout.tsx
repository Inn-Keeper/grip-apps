import { Platform } from "react-native";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { t } from "@grip/core/i18n";
import { useTabBarHidden } from "@/lib/uiStore";
import { useLocale } from "@/lib/useLocale";
import { colors, font } from "@/theme";

const { Icon, Label } = NativeTabs.Trigger;
const tabChrome = `${colors.bgDeep}E6`;
// iOS 26 draws the bar in Liquid Glass; a custom background would paint over it,
// so the dark blurred chrome is only for older iOS and Android.
const liquidGlass = Platform.OS === "ios" && Number.parseInt(String(Platform.Version), 10) >= 26;

// True native tab bar (UITabBarController on iOS, Liquid Glass on iOS 26;
// native bottom navigation on Android). Icons follow the web header's brand icons.
// The Arch Board's zen mode hides it for an edge-to-edge canvas.
export default function TabLayout() {
  const locale = useLocale();
  const hidden = useTabBarHidden();

  return (
    <NativeTabs
      key={locale}
      hidden={hidden}
      tintColor={colors.accent}
      backgroundColor={liquidGlass ? undefined : tabChrome}
      blurEffect={liquidGlass ? undefined : "systemUltraThinMaterialDark"}
      shadowColor={liquidGlass ? undefined : `${colors.border}80`}
      // iOS 26: the bar shrinks to a pill while you scroll down, and returns when you scroll up.
      minimizeBehavior="onScrollDown"
      iconColor={{ default: colors.textFaint, selected: colors.accentBright }}
      labelStyle={{
        default: { color: colors.textFaint, fontSize: font.size.captionLg, fontWeight: "600" },
        selected: { color: colors.accentBright, fontSize: font.size.captionLg, fontWeight: "700" },
      }}
      indicatorColor={colors.accent}
      rippleColor={`${colors.accent}22`}
      disableTransparentOnScrollEdge
    >
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "square.stack", selected: "square.stack.fill" }} />
        <Label>{t("tabs.prep")}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="stories">
        <Icon sf={{ default: "doc.text", selected: "doc.text.fill" }} />
        <Label>{t("tabs.stories")}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="board">
        <Icon sf={{ default: "square.grid.2x2", selected: "square.grid.2x2.fill" }} />
        <Label>{t("tabs.board")}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="quest">
        <Icon sf={{ default: "flag", selected: "flag.fill" }} />
        <Label>{t("tabs.quest")}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: "person", selected: "person.fill" }} />
        <Label>{t("tabs.profile")}</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
