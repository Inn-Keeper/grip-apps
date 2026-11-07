import { useState } from "react";
import { ScrollView, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ROLE_POSITIONS, STATUSES, STATUS_STYLES } from "@grip/core/contacts";
import { extractTechsFromText } from "@grip/core/techMatch";
import { categories } from "@grip/core/prepData";
import { t } from "@grip/core/i18n";
import { colors, layout } from "@/theme";
import { FormActions } from "@/components/FormActions";
import { Field, Pill, inputStyle, multilineStyle } from "@/components/ui";
import { Combobox } from "@/components/Combobox";
import { DateField } from "@/components/DateField";
import type { Contact } from "@grip/core/api";

const ALL_TECHS: string[] = categories.flatMap((c: { items: { tech: string }[] }) =>
  c.items.map((item) => item.tech)
);
const POSTING_TECH_LIMIT = 12;

export const EMPTY_CONTACT_FORM: Contact = {
  name: "",
  role: "",
  link: "",
  note: "",
  status: "Contacted",
  date: "",
  nextAction: "",
  nextActionDate: "",
  postingTechs: [],
};

type ContactFormProps = { initial: Contact; saving: boolean; error: string | null; onSave: (contact: Contact) => void; onCancel: () => void };

export function ContactForm({ initial, saving, error, onSave, onCancel }: ContactFormProps) {
  const [start] = useState({ ...EMPTY_CONTACT_FORM, ...initial });
  const [form, setForm] = useState(start);
  // The pasted posting is parsed on-device and never stored — only detected techs persist.
  const [posting, setPosting] = useState("");
  const insets = useSafeAreaInsets();
  const set = (field: keyof Contact) => (value: string) => setForm((current) => ({ ...current, [field]: value }));

  const handlePosting = (text: string) => {
    setPosting(text);
    if (!text.trim()) return; // keep saved chips when the paste box is cleared
    const detected = extractTechsFromText(text, ALL_TECHS, POSTING_TECH_LIMIT);
    setForm((current) => ({ ...current, postingTechs: detected.map((d: { tech: string }) => d.tech) }));
  };

  const removePostingTech = (tech: string) =>
    setForm((current) => ({ ...current, postingTechs: current.postingTechs.filter((item) => item !== tech) }));

  return (
    <ScrollView
      // Frozen while saving so the submitted values are what lands.
      pointerEvents={saving ? "none" : "auto"}
      style={{
        flex: 1,
        backgroundColor: colors.bg
      }}
      contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: insets.bottom + layout.tabBarClearance }}
      keyboardShouldPersistTaps="handled"
    >
      <Field label={t("contacts.fieldName")}>
        <TextInput accessibilityLabel={t("contacts.fieldName")} style={inputStyle} value={form.name} onChangeText={set("name")} autoFocus />
      </Field>
      <Field label={t("contacts.fieldStatus")}>
        <View style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 6
          }}>
          {STATUSES.map((status: string) => (
            <Pill
              key={status}
              label={t(`enum.status.${status}` as Parameters<typeof t>[0])}
              active={form.status === status}
              activeColor={STATUS_STYLES[status].color}
              onPress={() => set("status")(status)}
            />
          ))}
        </View>
      </Field>
      <Field label={t("contacts.fieldRole")}>
        <Combobox
          searchable
          value={form.role}
          onChange={set("role")}
          placeholder={t("contacts.fieldRolePlaceholder")}
          options={ROLE_POSITIONS.map((role: string) => ({ value: role, label: role }))}
        />
      </Field>
      <Field label={t("contacts.fieldLink")}>
        <TextInput
          style={inputStyle}
          value={form.link}
          onChangeText={set("link")}
          placeholder="https://…"
          placeholderTextColor={colors.textFaint}
          autoCapitalize="none"
          keyboardType="url"
        />
      </Field>
      <Field label={t("contacts.fieldNote")}>
        <TextInput style={inputStyle} value={form.note} onChangeText={set("note")} />
      </Field>
      <Field label={t("contacts.fieldPosting")}>
        <TextInput
          style={[inputStyle, multilineStyle]}
          value={posting}
          onChangeText={handlePosting}
          placeholder={t("contacts.postingPlaceholder")}
          placeholderTextColor={colors.textFaint}
          multiline
        />
      </Field>
      {form.postingTechs.length > 0 && (
        <Field label={t("contacts.postingDetected")}>
          <View style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 6
            }}>
            {form.postingTechs.map((tech) => (
              <Pill key={tech} label={`${tech} ×`} active onPress={() => removePostingTech(tech)} />
            ))}
          </View>
        </Field>
      )}
      <DateField label={t("contacts.fieldDate")} value={form.date} onChange={set("date")} />
      <Field label={t("contacts.fieldNextAction")}>
        <TextInput
          style={inputStyle}
          value={form.nextAction}
          onChangeText={set("nextAction")}
          placeholder={t("contacts.fieldNextActionPlaceholder")}
          placeholderTextColor={colors.textFaint}
        />
      </Field>
      <DateField label={t("contacts.nextActionDue")} value={form.nextActionDate} onChange={set("nextActionDate")} clearable />

      <FormActions
        canSave={!!form.name.trim()}
        saving={saving}
        error={error}
        dirty={!!posting.trim() || JSON.stringify(form) !== JSON.stringify(start)}
        onSave={() => onSave(form)}
        onCancel={onCancel}
      />
    </ScrollView>
  );
}
