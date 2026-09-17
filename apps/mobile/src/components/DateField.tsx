import { useState } from "react";
import { Modal, Platform, Pressable, Text, TouchableOpacity, View } from "react-native";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { formatDDMMYYYY, parseDDMMYYYY, todayDDMMYYYY } from "@grip-apps/core/contacts";
import { t } from "@grip-apps/core/i18n";
import { colors, tints } from "@/theme";
import { BrandIcon } from "@/components/BrandIcon";
import { Field, MiniButton, inputStyle } from "@/components/ui";

type Props = {
  label: string;
  /** DD-MM-YYYY, or "" when unset. */
  value: string;
  onChange: (value: string) => void;
  /** Optional fields render a Clear action; required ones don't. */
  clearable?: boolean;
};

/**
 * Date field styled like every other input; tapping opens the native
 * calendar — iOS inline picker in a themed bottom sheet, Android's dialog.
 * An empty field fills with today the moment it's tapped.
 */
export function DateField({ label, value, onChange, clearable = false }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const date = parseDDMMYYYY(value) ?? new Date();

  const openPicker = () => {
    if (!value) onChange(todayDDMMYYYY());
    setPickerOpen(true);
  };

  const handlePicked = (event: DateTimePickerEvent, picked?: Date) => {
    if (event.type !== "dismissed" && picked) onChange(formatDDMMYYYY(picked));
    setPickerOpen(false);
  };

  return (
    <Field label={label}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <TouchableOpacity onPress={openPicker} style={[inputStyle, { flex: 1 }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <BrandIcon name="calendar" color={value ? colors.accentBright : colors.textFaint} size={16} />
            <Text style={{ color: value ? colors.text : colors.textFaint, fontSize: 13 }}>
              {value || t("contacts.setDate")}
            </Text>
          </View>
        </TouchableOpacity>
        {clearable && !!value && (
          <MiniButton label={t("common.clear")} color={colors.textFaint} onPress={() => onChange("")} />
        )}
      </View>

      {pickerOpen && Platform.OS === "android" && (
        <DateTimePicker value={date} mode="date" onChange={handlePicked} />
      )}

      {pickerOpen && Platform.OS === "ios" && (
        // Modal's native slide animation — Reanimated entering animations
        // don't fire reliably inside RN Modals.
        <Modal transparent animationType="slide" visible onRequestClose={() => setPickerOpen(false)}>
          <Pressable onPress={() => setPickerOpen(false)} style={{ flex: 1, backgroundColor: tints.modalScrim }} />
          <View
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 16,
              paddingBottom: 32,
            }}
          >
            <DateTimePicker
              value={date}
              mode="date"
              display="inline"
              themeVariant="dark"
              accentColor={colors.accent}
              onChange={handlePicked}
            />
          </View>
        </Modal>
      )}
    </Field>
  );
}
