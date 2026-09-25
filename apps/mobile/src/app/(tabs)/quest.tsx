import { useState } from "react";
import { Alert, FlatList, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { STATUSES, isDue, todayDDMMYYYY } from "@grip/core/contacts";
import { buildFunnelSummary } from "@grip/core/funnel";
import { t } from "@grip/core/i18n";
import { useLocale } from "@/lib/useLocale";
import { colors, font, layout, tints } from "@/theme";
import { HeaderAction, Screen, ScreenHeader } from "@/components/ui";
import type { Contact } from "@grip/core/api";
import { ContactCard } from "@/components/contacts/ContactCard";
import { ContactForm, EMPTY_CONTACT_FORM } from "@/components/contacts/ContactForm";
import { QuestFunnel } from "@/components/contacts/QuestFunnel";
import {
  useAddRetroMutation,
  useContactStoriesQuery,
  useContactsQuery,
  useDeleteContactMutation,
  useDeleteRetroMutation,
  useSaveContactMutation,
  useStatusEventsQuery,
} from "@/queries/contacts";
import { useScores } from "@/lib/useScores";

export default function QuestScreen() {
  const locale = useLocale();
  const insets = useSafeAreaInsets();
  const [editing, setEditing] = useState<Contact | null>(null);
  const [retroFor, setRetroFor] = useState<string | null>(null);

  const { data: contacts, error } = useContactsQuery();
  const saveMutation = useSaveContactMutation();
  const deleteMutation = useDeleteContactMutation();
  const addRetroMutation = useAddRetroMutation();
  const deleteRetroMutation = useDeleteRetroMutation();

  const { data: statusEvents = [] } = useStatusEventsQuery();
  const { data: stories = [] } = useContactStoriesQuery();
  const { scores } = useScores();
  const funnel = buildFunnelSummary(contacts ?? [], statusEvents);
  const sorted = [...(contacts ?? [])].sort((a, b) => Number(isDue(b)) - Number(isDue(a)));
  const dueCount = funnel.due;

  const confirmDelete = (contact: Contact) =>
    Alert.alert(t("contacts.deleteTitle"), t("contacts.deleteMessage", { name: contact.name }), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("common.delete"), style: "destructive", onPress: () => deleteMutation.mutate(contact.id) },
    ]);

  const handleSave = (form: Contact) => {
    if (form.name.trim()) {
      saveMutation.mutate({ ...form, date: form.date || todayDDMMYYYY() });
    }
    setEditing(null);
  };

  const advanceStatus = (contact: Contact) => {
    const next = STATUSES[STATUSES.indexOf(contact.status) + 1];
    if (next) saveMutation.mutate({ ...contact, status: next, date: todayDDMMYYYY() });
  };

  const clearNextAction = (contact: Contact) =>
    saveMutation.mutate({ ...contact, nextAction: "", nextActionDate: "" });

  if (editing) {
    return (
      <Screen key={locale}>
        <ContactForm initial={editing} onSave={handleSave} onCancel={() => setEditing(null)} />
      </Screen>
    );
  }

  return (
    <Screen key={locale}>
      <ScreenHeader
        title={t("tabs.quest")}
        subtitle={t("screen.questSubtitle")}
        right={<HeaderAction icon="contact" label={t("contacts.addContact")} onPress={() => setEditing({ ...EMPTY_CONTACT_FORM, date: todayDDMMYYYY() })} />}
      />
      <FlatList
        data={sorted}
        keyExtractor={(contact) => contact.id!}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + layout.tabBarClearance }}
        ListHeaderComponent={
          <View style={{ gap: 12 }}>
            {error && <Text style={{ color: colors.dangerBright, fontSize: font.size.body }}>{t("contacts.loadError", { message: error.message })}</Text>}

            <QuestFunnel summary={funnel} />

            {dueCount > 0 && (
              <View
                style={{
                  padding: 12,
                  backgroundColor: tints.dangerSoft,
                  borderWidth: 1,
                  borderColor: `${colors.danger}60`,
                  borderRadius: 10,
                }}
              >
                <Text style={{ color: colors.dangerBright, fontSize: font.size.body, fontWeight: "600" }}>
                  {t("contacts.dueBanner", { count: dueCount, plural: dueCount > 1 ? "s" : "" })}
                </Text>
              </View>
            )}
          </View>
        }
        // No entrance animation: the list remounts after an edit and refetches mid-spring,
        // which can leave a card stuck invisible at its starting frame.
        renderItem={({ item }) => (
          <ContactCard
            contact={item}
            stories={stories}
            answers={scores.answers}
            retroFormOpen={retroFor === item.id}
            onEdit={() => setEditing(item)}
            onDelete={() => confirmDelete(item)}
            onAdvance={() => advanceStatus(item)}
            onClearAction={() => clearNextAction(item)}
            onToggleRetroForm={() => setRetroFor(retroFor === item.id ? null : item.id!)}
            onAddRetro={(retro) => {
              addRetroMutation.mutate({ contactId: item.id!, retro });
              setRetroFor(null);
            }}
            onDeleteRetro={(retroId) => deleteRetroMutation.mutate(retroId)}
          />
        )}
      />
    </Screen>
  );
}
