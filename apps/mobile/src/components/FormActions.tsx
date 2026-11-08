import { useCallback, useRef } from "react";
import { useFocusEffect } from "expo-router";
import { Alert, BackHandler, Keyboard, Text, View } from "react-native";
import { t } from "@grip/core/i18n";
import { font, useTheme } from "@/theme";
import { Button } from "@/components/ui";

// Runs onDiscard straight away when clean, after a confirm when the draft has changes.
export function confirmDiscard(dirty: boolean, onDiscard: () => void) {
  if (!dirty) return onDiscard();
  Alert.alert(t("common.discardConfirm"), undefined, [
    { text: t("common.cancel"), style: "cancel" },
    { text: t("common.discard"), style: "destructive", onPress: onDiscard },
  ]);
}

// Cancel and Save for a form: Save is blocked while pending, the failure sits beside it,
// and Cancel or Android Back asks before dropping a changed draft.
export function FormActions({ saveLabel = t("common.save"), canSave, saving, error, dirty, onSave, onCancel }: {
  saveLabel?: string;
  canSave: boolean;
  saving: boolean;
  error: string | null;
  dirty: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  const { colors } = useTheme();
  const cancel = () => { if (!saving) confirmDiscard(dirty, onCancel); };

  // Only while this screen is focused: tabs stay mounted, so a hidden form must not take Back.
  const cancelRef = useRef(cancel);
  cancelRef.current = cancel;
  useFocusEffect(useCallback(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => { cancelRef.current(); return true; });
    return () => sub.remove();
  }, []));

  return (
    <View style={{
        gap: 8,
        marginTop: 8
      }}>
      {error && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{
          color: colors.dangerBright,
          fontSize: font.size.body
        }}>{error}</Text>}
      <View style={{
          flexDirection: "row",
          gap: 8,
          justifyContent: "flex-end"
        }}>
        <Button label={t("common.cancel")} variant="ghost" onPress={cancel} disabled={saving} />
        <Button
          label={saving ? `${t("common.saving")}…` : saveLabel}
          onPress={() => { Keyboard.dismiss(); onSave(); }}
          disabled={!canSave || saving}
        />
      </View>
    </View>
  );
}
