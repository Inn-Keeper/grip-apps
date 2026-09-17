import type { ReactNode } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, font, radius, space, tints } from "@/theme";
import { BrandIcon, type BrandIconName } from "@/components/BrandIcon";
import { DemoBanner } from "@/components/DemoBanner";
import { useIsDemo } from "@/lib/useIsDemo";

/**
 * Tab screen root: app background + safe-area insets (native tabs render no
 * header). Left/right matter in landscape, where the sensor housing sits
 * on the side of the screen.
 */
export function Screen({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const isDemo = useIsDemo();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        paddingTop: insets.top,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
      {isDemo && <DemoBanner />}
      {children}
    </View>
  );
}

export const inputStyle = {
  backgroundColor: colors.well,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: radius.sm,
  padding: space.md,
  color: colors.text,
  fontSize: font.size.body,
} as const;

export const multilineStyle = { minHeight: 70, textAlignVertical: "top" } as const;

type PillProps = { label: string; active: boolean; activeColor?: string; icon?: BrandIconName; onPress: () => void };

/** Selectable chip — category filters, mode toggles, competency/status pickers. */
export function Pill({ label, active, activeColor = colors.accent, icon, onPress }: PillProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: space.xs,
        paddingHorizontal: space.md,
        paddingVertical: 7,
        borderRadius: radius.sm,
        backgroundColor: active ? activeColor : colors.surface,
        borderWidth: 1,
        borderColor: active ? activeColor : colors.border,
      }}
    >
      {icon && <BrandIcon name={icon} color={active ? colors.onAccent : colors.textDim} size={14} />}
      <Text style={{ fontSize: font.size.body, fontWeight: "600", color: active ? colors.onAccent : colors.textDim }}>{label}</Text>
    </TouchableOpacity>
  );
}

type HeaderActionProps = { label: string; onPress: () => void; icon?: BrandIconName; tone?: "accent" | "muted" | "danger"; disabled?: boolean };

/** Compact action for a screen header right slot. */
export function HeaderAction({ label, onPress, icon, tone = "accent", disabled = false }: HeaderActionProps) {
  const color = tone === "danger" ? colors.dangerBright : tone === "muted" ? colors.textDim : colors.accentBright;
  const borderColor = tone === "danger" ? `${colors.danger}50` : tone === "muted" ? colors.border : `${colors.accent}50`;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: space.xs,
        paddingHorizontal: space.md,
        paddingVertical: 7,
        borderRadius: radius.sm,
        backgroundColor: tone === "accent" ? tints.accentSoft : colors.surface,
        borderWidth: 1,
        borderColor,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {icon && <BrandIcon name={icon} color={color} size={14} />}
      <Text style={{ color, fontSize: font.size.small, fontWeight: "700" }}>{label}</Text>
    </TouchableOpacity>
  );
}

type ScreenHeaderProps = { title: string; subtitle?: string; right?: ReactNode; children?: ReactNode };

/** In-tab header: title/action row plus optional segmented controls. */
export function ScreenHeader({ title, subtitle, right, children }: ScreenHeaderProps) {
  return (
    <View
      style={{
        paddingHorizontal: space.lg,
        paddingTop: space.sm,
        paddingBottom: space.md,
        backgroundColor: colors.bg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        gap: space.md,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ color: colors.textBright, fontSize: font.size.heading, fontWeight: "800" }}>{title}</Text>
          {!!subtitle && (
            <Text numberOfLines={2} style={{ marginTop: 2, color: colors.textDim, fontSize: font.size.small, lineHeight: 17 }}>
              {subtitle}
            </Text>
          )}
        </View>
        {right}
      </View>
      {children}
    </View>
  );
}

type SegmentedOption = { key: string | number; label: string; color?: string; icon?: BrandIconName };
type SegmentedPillsProps = { options: SegmentedOption[]; activeKey: string | number; onChange: (key: string | number) => void };

/** Horizontal segmented selector housed by ScreenHeader or form fields. */
export function SegmentedPills({ options, activeKey, onChange }: SegmentedPillsProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: space.sm }}>
      {options.map((option) => (
        <Pill
          key={String(option.key)}
          label={option.label}
          icon={option.icon}
          active={option.key === activeKey}
          activeColor={option.color}
          onPress={() => onChange(option.key)}
        />
      ))}
    </ScrollView>
  );
}

type BadgeProps = { label: string; color: string };

/** Small colored label — statuses, competencies. */
export function Badge({ label, color }: BadgeProps) {
  return (
    <View style={{ paddingHorizontal: space.sm, paddingVertical: space.xs, backgroundColor: `${color}20`, borderRadius: radius.pill }}>
      <Text style={{ color, fontSize: font.size.caption, fontWeight: "700", letterSpacing: 0.4 }}>{label.toUpperCase()}</Text>
    </View>
  );
}

type MiniButtonProps = { label: string; color: string; onPress: () => void };

/** Compact outlined action — edit/delete/advance rows on cards. */
export function MiniButton({ label, color, onPress }: MiniButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{ paddingHorizontal: space.sm, paddingVertical: space.xs, borderWidth: 1, borderColor: `${color}50`, borderRadius: radius.sm }}
    >
      <Text style={{ color, fontSize: font.size.label, fontWeight: "600" }}>{label}</Text>
    </TouchableOpacity>
  );
}

type ButtonProps = { label: string; onPress: () => void; variant?: "primary" | "ghost"; disabled?: boolean };

/** Form-level action button. */
export function Button({ label, onPress, variant = "primary", disabled = false }: ButtonProps) {
  const primary = variant === "primary";
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={{
        paddingHorizontal: space.lg,
        paddingVertical: space.sm,
        borderRadius: radius.sm,
        backgroundColor: primary ? colors.accent : "transparent",
        borderWidth: primary ? 0 : 1,
        borderColor: colors.border,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Text style={{ color: primary ? colors.onAccent : colors.textDim, fontSize: font.size.body, fontWeight: "600" }}>{label}</Text>
    </TouchableOpacity>
  );
}

type FieldProps = { label: string; children: ReactNode };

/** Labeled form field. */
export function Field({ label, children }: FieldProps) {
  return (
    <View style={{ gap: space.xs }}>
      <Text style={{ fontSize: font.size.label, fontWeight: "600", color: colors.textFaint, letterSpacing: 0.3 }}>{label}</Text>
      {children}
    </View>
  );
}

type SectionProps = { label: string; text: string };

/** Labeled read-only text block — STAR sections, retro fields. */
export function Section({ label, text }: SectionProps) {
  if (!text) return null;
  return (
    <View>
      <Text style={{ fontSize: font.size.caption, fontWeight: "700", color: colors.textFaint, letterSpacing: 0.8, marginBottom: 2 }}>
        {label.toUpperCase()}
      </Text>
      <Text style={{ fontSize: font.size.body, lineHeight: 19, color: colors.text }}>{text}</Text>
    </View>
  );
}
