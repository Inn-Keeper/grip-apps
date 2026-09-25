import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from "react-native-reanimated";
import { colors, font, tints } from "@/theme";
import { BrandIcon } from "@/components/BrandIcon";

// idle: not answered yet · correct/wrong: the right answer and a wrong pick · dimmed: other options after answering.
export type OptionState = "idle" | "correct" | "wrong" | "dimmed";

type Props = { letter: string; text: string; state: OptionState; color: string; onPress: () => void };

const PRESS_SPRING = { damping: 18, stiffness: 320 };

const LOOK = {
  idle: { bg: colors.surfaceHi, border: colors.border, text: colors.text },
  dimmed: { bg: colors.surfaceHi, border: colors.border, text: colors.textDim },
  correct: { bg: tints.successSoft, border: `${colors.success}80`, text: colors.successBright },
  wrong: { bg: tints.dangerSoft, border: `${colors.danger}80`, text: colors.dangerBright },
};

// One answer: shrinks while pressed, pops when it is the right answer, shakes when it was a wrong pick.
export function AnswerOption({ letter, text, state, color, onPress }: Props) {
  const scale = useSharedValue(1);
  const shift = useSharedValue(0);

  useEffect(() => {
    if (state === "correct") scale.value = withSequence(withSpring(1.03, PRESS_SPRING), withSpring(1, PRESS_SPRING));
    if (state === "wrong") {
      shift.value = withSequence(
        withTiming(-6, { duration: 50 }),
        withTiming(6, { duration: 60 }),
        withTiming(-4, { duration: 60 }),
        withTiming(0, { duration: 50 })
      );
    }
  }, [state, scale, shift]);

  const motion = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }, { translateX: shift.value }] }));
  const look = LOOK[state];
  const answered = state !== "idle";

  return (
    <Animated.View style={[motion, { opacity: state === "dimmed" ? 0.55 : 1 }]}>
      <Pressable
        disabled={answered}
        onPress={onPress}
        onPressIn={() => (scale.value = withSpring(0.97, PRESS_SPRING))}
        onPressOut={() => (scale.value = withSpring(1, PRESS_SPRING))}
        accessibilityRole="button"
        accessibilityLabel={`${letter}. ${text}`}
        accessibilityState={{ disabled: answered, selected: state === "correct" || state === "wrong" }}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          padding: 11,
          backgroundColor: look.bg,
          borderWidth: 1,
          borderColor: look.border,
          borderRadius: 10,
        }}
      >
        {/* Letter badge reads as "tap me"; it turns into a check or cross once answered. */}
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: answered ? look.border : `${color}60`,
            backgroundColor: answered ? "transparent" : `${color}14`,
          }}
        >
          {state === "correct" || state === "wrong" ? (
            <BrandIcon name={state === "correct" ? "check" : "close"} color={look.text} size={12} />
          ) : (
            <Text style={{ fontSize: font.size.label, fontWeight: "700", color: answered ? look.text : color }}>{letter}</Text>
          )}
        </View>
        <Text style={{ flex: 1, fontSize: font.size.body, lineHeight: 18, color: look.text }}>{text}</Text>
      </Pressable>
    </Animated.View>
  );
}
