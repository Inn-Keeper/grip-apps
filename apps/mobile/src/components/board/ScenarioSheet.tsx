import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { t } from "@grip/core/i18n";
import { filterGroups } from "@grip/core/scenarioCatalog";
import { colors, tints } from "@/theme";
import { BrandIcon } from "@/components/BrandIcon";
import { inputStyle } from "@/components/ui";

type Group = { label: string; options: { value: string; label: string }[] };

type Props = {
  visible: boolean;
  groups: Group[];
  activeId: string;
  onPick: (id: string) => void;
  onClose: () => void;
};

// Picks one of the 100+ scenarios: a search field over the list, grouped by category.
// Typing a category name ("fintech") shows that whole group, like the web picker.
export function ScenarioSheet({ visible, groups, activeId, onPick, onClose }: Props) {
  const [query, setQuery] = useState("");
  const visibleGroups = filterGroups(groups, query.trim().toLowerCase());
  // The search starts empty every time the sheet opens.
  const close = () => {
    setQuery("");
    onClose();
  };

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={close}>
      <Pressable onPress={close} style={{ flex: 1, backgroundColor: tints.modalScrim }} accessibilityLabel={t("common.close")} />
      <View
        style={{
          maxHeight: "80%",
          backgroundColor: colors.surface,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 16,
          gap: 10,
        }}
      >
        <Text style={{ fontSize: 15, fontWeight: "700", color: colors.textBright }}>{t("board.pickScenario")}</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t("common.search")}
          placeholderTextColor={colors.textFaint}
          accessibilityLabel={t("common.search")}
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
          style={inputStyle}
        />
        <ScrollView style={{ flexGrow: 0 }} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 12 }}>
          {visibleGroups.length === 0 && (
            <Text style={{ fontSize: 13, color: colors.textFaint, paddingVertical: 8 }}>{t("common.noMatches")}</Text>
          )}
          {visibleGroups.map((group) => (
            <View key={group.label} style={{ marginBottom: 6 }}>
              <Text style={{ fontSize: 11, fontWeight: "800", letterSpacing: 0.6, color: colors.textFaint, paddingVertical: 6 }}>
                {group.label.toUpperCase()}
              </Text>
              {group.options.map((option) => {
                const active = option.value === activeId;
                return (
                  <TouchableOpacity
                    key={option.value}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => {
                      onPick(option.value);
                      close();
                    }}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                      minHeight: 44,
                      paddingHorizontal: 10,
                      borderRadius: 8,
                      backgroundColor: active ? tints.accentSoft : "transparent",
                    }}
                  >
                    <Text style={{ flex: 1, fontSize: 14, fontWeight: active ? "700" : "500", color: active ? colors.accentBright : colors.text }}>
                      {option.label}
                    </Text>
                    {active && <BrandIcon name="check" color={colors.accentBright} size={14} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}
