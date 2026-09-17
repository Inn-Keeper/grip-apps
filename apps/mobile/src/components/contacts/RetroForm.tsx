import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { extractTechsFromText } from "@grip-apps/core/cvTechs";
import { categories } from "@grip-apps/core/prepData";
import { t } from "@grip-apps/core/i18n";
import { colors } from "@/theme";
import { Button, Field, Pill, inputStyle, multilineStyle } from "@/components/ui";

const ALL_TECHS: string[] = categories.flatMap((c: { items: { tech: string }[] }) =>
  c.items.map((item) => item.tech)
);

export const EMPTY_RETRO = {
  round: "",
  questions: "",
  wentWell: "",
  toImprove: "",
  struggledTechs: [] as string[],
};

type RetroFormProps = { onSave: (retro: typeof EMPTY_RETRO) => void; onCancel: () => void };

export function RetroForm({ onSave, onCancel }: RetroFormProps) {
  const [form, setForm] = useState({ ...EMPTY_RETRO });
  // Techs manually toggled off — struggles are detected from the retro text,
  // and everything detected counts unless the user opts a tech out.
  const [excluded, setExcluded] = useState<string[]>([]);
  const set = (field: keyof typeof EMPTY_RETRO) => (value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  const detected = extractTechsFromText(`${form.questions}\n${form.toImprove}`, ALL_TECHS).map(
    (d: { tech: string }) => d.tech
  );
  const struggledTechs = detected.filter((tech) => !excluded.includes(tech));
  const toggleTech = (tech: string) =>
    setExcluded((current) =>
      current.includes(tech) ? current.filter((item) => item !== tech) : [...current, tech]
    );

  return (
    <View
      style={{
        padding: 12,
        backgroundColor: colors.well,
        borderWidth: 1,
        borderColor: `${colors.accent}60`,
        borderRadius: 10,
        gap: 8,
      }}
    >
      <Field label={t("retro.round")}>
        <TextInput
          style={inputStyle}
          value={form.round}
          onChangeText={set("round")}
          placeholder={t("retro.roundPlaceholder")}
          placeholderTextColor={colors.textFaint}
          autoFocus
        />
      </Field>
      <Field label={t("retro.questions")}>
        <TextInput style={[inputStyle, multilineStyle]} value={form.questions} onChangeText={set("questions")} multiline />
      </Field>
      <Field label={t("retro.wentWell")}>
        <TextInput style={[inputStyle, multilineStyle]} value={form.wentWell} onChangeText={set("wentWell")} multiline />
      </Field>
      <Field label={t("retro.toImprove")}>
        <TextInput style={[inputStyle, multilineStyle]} value={form.toImprove} onChangeText={set("toImprove")} multiline />
      </Field>
      {detected.length > 0 && (
        <Field label={t("retro.struggled")}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {detected.map((tech) => (
              <Pill key={tech} label={tech} active={!excluded.includes(tech)} onPress={() => toggleTech(tech)} />
            ))}
          </View>
          <Text style={{ fontSize: 11, color: colors.textFaint, marginTop: 4 }}>{t("retro.struggledHint")}</Text>
        </Field>
      )}
      <View style={{ flexDirection: "row", gap: 8, justifyContent: "flex-end" }}>
        <Button label={t("common.cancel")} variant="ghost" onPress={onCancel} />
        <Button label={t("contacts.saveRetro")} onPress={() => onSave({ ...form, struggledTechs })} />
      </View>
    </View>
  );
}
