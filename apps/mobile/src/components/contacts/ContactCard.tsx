import { useState } from "react";
import { Linking, Text, TouchableOpacity, View } from "react-native";
import { STATUSES, STATUS_STYLES, isDue } from "@grip/core/contacts";
import { t } from "@grip/core/i18n";
import { colors, tints, shadow } from "@/theme";
import { BrandIcon } from "@/components/BrandIcon";
import { Badge, MiniButton, Section } from "@/components/ui";
import type { Contact } from "@grip/core/api";
import { RetroForm, EMPTY_RETRO } from "./RetroForm";
import { StoryMatchSection, type StoryItem } from "./StoryMatchSection";
import { PrepPlanSection } from "./PrepPlanSection";

type ContactCardProps = {
  contact: Contact;
  stories: StoryItem[];
  answers: Record<string, { correct: number; wrong: number }>;
  retroFormOpen: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onAdvance: () => void;
  onClearAction: () => void;
  onToggleRetroForm: () => void;
  onAddRetro: (retro: typeof EMPTY_RETRO) => void;
  onDeleteRetro: (retroId: string) => void;
};

export function ContactCard({
  contact,
  stories,
  answers,
  retroFormOpen,
  onEdit,
  onDelete,
  onAdvance,
  onClearAction,
  onToggleRetroForm,
  onAddRetro,
  onDeleteRetro,
}: ContactCardProps) {
  const [showRetros, setShowRetros] = useState(false);
  const status = STATUS_STYLES[contact.status] ?? STATUS_STYLES.Contacted;
  const nextStatus = STATUSES[STATUSES.indexOf(contact.status) + 1];
  const due = isDue(contact);
  const retros = contact.retros ?? [];

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: due ? `${colors.danger}80` : colors.borderSoft, boxShadow: shadow.card,
        borderRadius: 14,
        padding: 16,
        gap: 8,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <Badge label={t(`enum.status.${contact.status}` as Parameters<typeof t>[0])} color={status.color} />
        {!!contact.date && <Text style={{ fontSize: 11, color: colors.textFaint }}>{contact.date}</Text>}
        <View style={{ flexDirection: "row", gap: 6, marginLeft: "auto" }}>
          {nextStatus && (
            <MiniButton label={`→ ${t(`enum.status.${nextStatus}` as Parameters<typeof t>[0])}`} color={STATUS_STYLES[nextStatus].color} onPress={onAdvance} />
          )}
          <MiniButton label={t("contacts.addRetro")} color={colors.accentBright} onPress={onToggleRetroForm} />
        </View>
      </View>

      <Text style={{ fontSize: 15, fontWeight: "600", color: colors.textBright }}>{contact.name}</Text>

      {!!contact.role &&
        (contact.link ? (
          <TouchableOpacity onPress={() => Linking.openURL(contact.link)}>
            <Text style={{ fontSize: 13, color: colors.accentBright }}>{contact.role} ↗</Text>
          </TouchableOpacity>
        ) : (
          <Text style={{ fontSize: 13, color: colors.text }}>{contact.role}</Text>
        ))}

      {!!contact.note && <Text style={{ fontSize: 12.5, color: colors.textDim }}>{contact.note}</Text>}

      {!!contact.nextAction && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            padding: 10,
            backgroundColor: due ? tints.dangerSoft : tints.warningSoft,
            borderWidth: 1,
            borderColor: due ? `${colors.danger}60` : `${colors.warning}40`,
            borderRadius: 8,
          }}
        >
          <BrandIcon name={due ? "warning" : "calendar"} color={due ? colors.dangerBright : colors.warningBright} size={15} />
          <Text style={{ flex: 1, fontSize: 12.5, color: due ? colors.dangerBright : colors.warningBright }}>
            {due ? "DUE · " : ""}
            {contact.nextAction}
            {!!contact.nextActionDate && ` · ${contact.nextActionDate}`}
          </Text>
          <MiniButton label={t("common.done")} color={due ? colors.dangerBright : colors.warningBright} onPress={onClearAction} />
        </View>
      )}

      {contact.status === "Interviewing" && contact.postingTechs.length > 0 && (
        <PrepPlanSection contact={contact} answers={answers} stories={stories} />
      )}

      <StoryMatchSection stories={stories} />

      <View style={{ flexDirection: "row", gap: 8, justifyContent: "flex-end" }}>
        {retros.length > 0 && (
          <MiniButton
            label={`${t("contacts.retros", { count: retros.length })} ${showRetros ? "Collapse" : "Expand"}`}
            color={colors.textDim}
            onPress={() => setShowRetros((value) => !value)}
          />
        )}
        <MiniButton label={t("common.edit")} color={colors.textDim} onPress={onEdit} />
        <MiniButton label={t("common.delete")} color={colors.danger} onPress={onDelete} />
      </View>

      {showRetros &&
        retros.map((retro) => (
          <View
            key={retro.id}
            style={{
              padding: 12,
              backgroundColor: colors.well,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 8,
              gap: 6,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: colors.text, flex: 1 }}>
                {retro.round || t("retro.round")}
              </Text>
              <Text style={{ fontSize: 11, color: colors.textFaint }}>{retro.date}</Text>
              <MiniButton label={t("contacts.removeRetro")} color={colors.textFaint} onPress={() => onDeleteRetro(retro.id)} />
            </View>
            <Section label={t("contacts.questionsAsked")} text={retro.questions} />
            <Section label={t("retro.wentWell")} text={retro.wentWell} />
            <Section label={t("retro.toImprove")} text={retro.toImprove} />
            <Section label={t("retro.struggled")} text={retro.struggledTechs.join(", ")} />
          </View>
        ))}

      {retroFormOpen && <RetroForm onSave={onAddRetro} onCancel={onToggleRetroForm} />}
    </View>
  );
}
