import { Linking, Text, TouchableOpacity, View } from "react-native";
import { techLinks } from "@grip/core/techLinks";
import { CORRECT_XP } from "@grip/core/gamification";
import { colors, tints } from "@/theme";
import { BrandIcon } from "@/components/BrandIcon";

type Question = { question: string; options: string[]; correct: number };

type Props = {
  tech: string;
  color: string;
  question: Question;
  questionNumber: number;
  total: number;
  answered: number | null;
  onAnswer: (i: number) => void;
  onNext: () => void;
  isLast: boolean;
};

export function QuizView({ tech, color, question, questionNumber, total, answered, onAnswer, onNext, isLast }: Props) {
  const isCorrect = answered !== null && answered === question.correct;
  const link = techLinks[tech];

  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 10, fontWeight: "700", color, letterSpacing: 0.8 }}>
          {tech.toUpperCase()} · QUIZ
        </Text>
        <Text style={{ fontSize: 10, color: colors.textFaint }}>
          {questionNumber} / {total}
        </Text>
      </View>

      <Text style={{ fontSize: 14, lineHeight: 20, color: colors.text, fontWeight: "500" }}>
        {question.question}
      </Text>

      <View style={{ gap: 7 }}>
        {question.options.map((opt, i) => {
          const isThisCorrect = i === question.correct;
          const isThisChosen = answered === i;
          let bg = colors.surfaceHi;
          let border = colors.border;
          let textColor = colors.textDim;
          if (answered !== null) {
            if (isThisCorrect) {
              bg = tints.successSoft;
              border = `${colors.success}80`;
              textColor = colors.successBright;
            } else if (isThisChosen) {
              bg = tints.dangerSoft;
              border = `${colors.danger}80`;
              textColor = colors.dangerBright;
            }
          }
          return (
            <TouchableOpacity
              key={i}
              disabled={answered !== null}
              onPress={() => onAnswer(i)}
              style={{ padding: 11, backgroundColor: bg, borderWidth: 1, borderColor: border, borderRadius: 8 }}
            >
              <Text style={{ fontSize: 12.5, lineHeight: 18, color: textColor }}>
                <Text style={{ opacity: 0.5 }}>{String.fromCharCode(65 + i)}. </Text>
                {opt}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {answered !== null && (
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 2 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: isCorrect ? colors.success : colors.danger }}>
              {isCorrect ? `Correct! +${CORRECT_XP} XP` : "Incorrect"}
            </Text>
            {link && (
              <TouchableOpacity onPress={() => Linking.openURL(link)}>
                <Text style={{ fontSize: 12, color: colors.accentBright, fontWeight: "500" }}>Docs ↗</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            onPress={onNext}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 7,
              backgroundColor: `${color}25`,
              borderWidth: 1,
              borderColor: `${color}60`,
              borderRadius: 8,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}><Text style={{ fontSize: 12, fontWeight: "600", color }}>{isLast ? "Done" : "Next"}</Text><BrandIcon name={isLast ? "check" : "arrowRight"} color={color} size={12} /></View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
