import { TouchableOpacity, View } from "react-native";
import { colors, radius } from "@/theme";

// The app's toggle, drawn in brand colours (the native Switch follows the OS palette).
export function Switch({ checked, disabled, onChange }: { checked: boolean; disabled: boolean; onChange: (checked: boolean) => void }) {
  return (
    <TouchableOpacity
      accessibilityRole="switch"
      accessibilityState={{ checked, disabled }}
      onPress={() => onChange(!checked)}
      disabled={disabled}
      style={{
        width: 48,
        height: 28,
        padding: 3,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: checked ? colors.accent : colors.border,
        backgroundColor: checked ? colors.accent : colors.bgDeep,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: checked ? colors.onAccent : colors.textFaint,
          transform: [{ translateX: checked ? 20 : 0 }],
        }}
      />
    </TouchableOpacity>
  );
}
