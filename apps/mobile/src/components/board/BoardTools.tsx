import type { ReactNode } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { t } from "@grip/core/i18n";
import { colors, font } from "@/theme";
import { BrandIcon, type BrandIconName } from "@/components/BrandIcon";

export type Tool = "text" | "arrow" | "line";
export type Shape = "rect" | "diamond" | "ellipse" | "note";
type Key = Parameters<typeof t>[0];

type Props = {
  onOpenComponents: () => void;
  onAddShape: (shape: Shape) => void;
  tool: Tool | null;
  onTool: (tool: Tool) => void;
};

const SHAPES: { shape: Shape; icon: BrandIconName }[] = [
  { shape: "rect", icon: "shapeRect" },
  { shape: "diamond", icon: "shapeDiamond" },
  { shape: "ellipse", icon: "shapeEllipse" },
  { shape: "note", icon: "shapeNote" },
];
const TOOLS: { tool: Tool; icon: BrandIconName }[] = [
  { tool: "arrow", icon: "arrowRight" },
  { tool: "line", icon: "shapeLine" },
  { tool: "text", icon: "text" },
];

function ToolButton({ label, hint, active, onPress, children }: { label: string; hint?: string; active?: boolean; onPress: () => void; children: ReactNode }) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={active === undefined ? undefined : { selected: active }}
      onPress={onPress}
      style={{
        minWidth: 40,
        height: 40,
        paddingHorizontal: 8,
        borderRadius: 10,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        backgroundColor: active ? `${colors.accent}40` : "transparent"
      }}
    >
      {children}
    </TouchableOpacity>
  );
}

// The board's tool row, floating at the canvas bottom (web's canvas tool bar): the built-in
// components behind one sheet, then the four shapes (added at once) and the draw tools
// (armed until used). Scrolls sideways on narrow phones.
export function BoardTools({ onOpenComponents, onAddShape, tool, onTool }: Props) {
  return (
    <View style={{
        position: "absolute",
        bottom: 8,
        left: 8,
        right: 8,
        backgroundColor: `${colors.bgDeep}e6`,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12
      }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{
          alignItems: "center",
          gap: 2,
          padding: 4
        }}>
        <ToolButton label={t("board.components")} onPress={onOpenComponents}>
          <BrandIcon name="layers" color={colors.textDim} size={16} />
          <Text style={{
              fontSize: font.size.small,
              fontWeight: "600",
              color: colors.text
            }}>{t("board.components")}</Text>
        </ToolButton>
        <View style={{
            width: 1,
            alignSelf: "stretch",
            marginVertical: 6,
            backgroundColor: colors.border
          }} />
        {SHAPES.map(({ shape, icon }) => (
          <ToolButton key={shape} label={t(`board.shape.${shape}` as Key)} onPress={() => onAddShape(shape)}>
            <BrandIcon name={icon} color={colors.textDim} size={18} />
          </ToolButton>
        ))}
        <View style={{
            width: 1,
            alignSelf: "stretch",
            marginVertical: 6,
            backgroundColor: colors.border
          }} />
        {TOOLS.map(({ tool: name, icon }) => (
          <ToolButton
            key={name}
            label={t(`board.tool.${name}` as Key)}
            hint={t(`board.tool.${name}HintTouch` as Key)}
            active={tool === name}
            onPress={() => onTool(name)}
          >
            <BrandIcon name={icon} color={tool === name ? colors.accentBright : colors.textDim} size={18} />
          </ToolButton>
        ))}
      </ScrollView>
    </View>
  );
}
