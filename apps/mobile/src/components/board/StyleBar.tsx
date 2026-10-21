import type { ReactNode } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { ARROW_HEADS, FILL_COLORS, TEXT_ALIGNS, TEXT_COLORS, TEXT_SIZES, styleOf, type BoardNode, type FreeStyle } from "@grip/core/arch";
import { t } from "@grip/core/i18n";
import { colors, font } from "@/theme";
import { BrandIcon } from "@/components/BrandIcon";

type Props = { node: BoardNode; onChange: (patch: FreeStyle) => void; onDelete: () => void };
type Key = Parameters<typeof t>[0];

const SIZE_LABELS: Record<string, string> = { s: "S", m: "M", l: "L", xl: "XL" };
const ALIGN_ICONS = { left: "alignLeft", center: "alignCenter", right: "alignRight" } as const;
const HEAD_GLYPHS: Record<string, string> = { end: "→", both: "↔", none: "—" };

function Option({ label, pressed, onPress, children }: { label: string; pressed: boolean; onPress: () => void; children: ReactNode }) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: pressed }}
      onPress={onPress}
      hitSlop={4}
      style={{
        minWidth: 34,
        height: 34,
        paddingHorizontal: 6,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: pressed ? `${colors.accent}40` : "transparent"
      }}
    >
      {children}
    </TouchableOpacity>
  );
}

function Swatch({ color }: { color: string | undefined }) {
  return <View style={{
      width: 16,
      height: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: color ?? "transparent"
    }} />;
}

const Divider = () => <View style={{
    width: 1,
    alignSelf: "stretch",
    marginVertical: 6,
    marginHorizontal: 2,
    backgroundColor: colors.border
  }} />;

// The selected item's style, floating at the top of the canvas (web's style panel): size,
// colour, fill, alignment and bold for text, shapes and components; colour, dashes and
// heads for arrows and lines; the trash bin last. Scrolls sideways on narrow phones.
export function StyleBar({ node, onChange, onDelete }: Props) {
  const style = styleOf(node);
  const arrow = node.type === "arrow";
  const text = (value: string, bold = false) => (
    <Text style={{
        fontSize: font.size.small,
        fontWeight: bold ? "800" : "600",
        color: colors.text
      }}>{value}</Text>
  );
  return (
    <View
      accessibilityRole="toolbar"
      accessibilityLabel={t(arrow ? "board.style.arrowPanel" : "board.style.panel")}
      style={{
        position: "absolute",
        top: 8,
        left: 8,
        right: 8,
        backgroundColor: `${colors.surface}f2`,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12
      }}
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{
          alignItems: "center",
          padding: 3
        }}>
        {!arrow && TEXT_SIZES.map((size) => (
          <Option key={size} label={t("board.style.sizeOption", { size: SIZE_LABELS[size] ?? size })} pressed={style.size === size} onPress={() => onChange({ size: size as FreeStyle["size"] })}>
            {text(SIZE_LABELS[size] ?? size)}
          </Option>
        ))}
        {!arrow && <Divider />}
        {TEXT_COLORS.map((color) => (
          <Option key={color} label={t(`board.style.color.${color}` as Key)} pressed={style.color === color} onPress={() => onChange({ color: color as FreeStyle["color"] })}>
            <Swatch color={colors[color as keyof typeof colors] as string} />
          </Option>
        ))}
        {!arrow && node.type !== "text" && (
          <>
            <Divider />
            {FILL_COLORS.map((fill) => {
              const name = fill === "none" ? t("board.style.fill.none") : t(`board.style.color.${fill}` as Key);
              return (
                <Option key={fill} label={t("board.style.fillOption", { color: name })} pressed={style.fill === fill} onPress={() => onChange({ fill: fill as FreeStyle["fill"] })}>
                  <Swatch color={fill === "none" ? undefined : `${colors[fill as keyof typeof colors]}66`} />
                </Option>
              );
            })}
          </>
        )}
        {!arrow && (
          <>
            <Divider />
            {TEXT_ALIGNS.map((align) => (
              <Option key={align} label={t(`board.style.align.${align}` as Key)} pressed={style.align === align} onPress={() => onChange({ align: align as FreeStyle["align"] })}>
                <BrandIcon name={ALIGN_ICONS[align as keyof typeof ALIGN_ICONS]} color={colors.text} size={16} />
              </Option>
            ))}
            <Option label={t("board.style.bold")} pressed={style.bold} onPress={() => onChange({ bold: !style.bold })}>
              {text("B", true)}
            </Option>
          </>
        )}
        {arrow && (
          <>
            <Divider />
            <Option label={t("board.style.dashed")} pressed={style.dashed} onPress={() => onChange({ dashed: !style.dashed })}>
              {text("- -")}
            </Option>
            {ARROW_HEADS.map((heads) => (
              <Option key={heads} label={t(`board.style.heads.${heads}` as Key)} pressed={style.heads === heads} onPress={() => onChange({ heads: heads as FreeStyle["heads"] })}>
                {text(HEAD_GLYPHS[heads] ?? heads)}
              </Option>
            ))}
          </>
        )}
        <Divider />
        <Option label={t("board.deleteSelected")} pressed={false} onPress={onDelete}>
          <BrandIcon name="trash" color={colors.dangerBright} size={16} />
        </Option>
      </ScrollView>
    </View>
  );
}
