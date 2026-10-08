import { useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { colors, font, radius, space, tints } from "@/theme";
import { BrandIcon } from "@/components/BrandIcon";
import { inputStyle } from "@/components/ui";

const DEFAULT_MAX_HEIGHT = 180;

export type ComboboxOption = { value: string; label: string; color?: string };

type ComboboxProps = {
  label?: string;
  value: string;
  options: ComboboxOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  /**
   * Free-text typeahead: the typed value filters the options and is kept even if
   * it doesn't match one (for open fields like Role/Position). Otherwise the
   * control is a plain tap-to-open select.
   */
  searchable?: boolean;
  maxHeight?: number;
};

// React Native twin of the web Combobox. The list renders inline below the
// control (not absolutely positioned) so it never gets clipped inside a ScrollView.
export function Combobox({
  label,
  value,
  options,
  onChange,
  placeholder = "Select...",
  searchable = false,
  maxHeight = DEFAULT_MAX_HEIGHT,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);

  const selected = options.find((option) => option.value === value);
  const query = searchable ? value.trim().toLowerCase() : "";
  const visibleOptions = query
    ? options.filter((option) => option.label.toLowerCase().includes(query))
    : options;

  const choose = (next: string) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <View style={{ gap: space.xs }}>
      {label && (
        <Text style={{
            fontSize: font.size.label,
            fontWeight: "600",
            color: colors.textFaint,
            letterSpacing: 0.3
          }}>
          {label}
        </Text>
      )}

      {searchable ? (
        <TextInput
          accessibilityLabel={label}
          style={inputStyle}
          value={value}
          onChangeText={(next) => {
            onChange(next);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          placeholderTextColor={colors.textFaint}
        />
      ) : (
        <TouchableOpacity
          accessibilityLabel={label}
          accessibilityRole="button"
          onPress={() => setOpen((current) => !current)}
          style={[inputStyle, { flexDirection: "row", alignItems: "center", gap: space.sm }]}
        >
          {selected?.color && <View style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: selected.color
            }} />}
          <Text style={{
              flex: 1,
              color: selected ? colors.text : colors.textFaint,
              fontSize: font.size.body
            }} numberOfLines={1}>
            {selected?.label ?? placeholder}
          </Text>
          <BrandIcon name="arrowDown" color={colors.textFaint} size={12} />
        </TouchableOpacity>
      )}

      {open && visibleOptions.length > 0 && (
        <View
          style={{
            maxHeight,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radius.sm,
            backgroundColor: colors.bgDeep,
            overflow: "hidden",
          }}
        >
          <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
            {visibleOptions.map((option) => {
              const active = option.value === value;
              return (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => choose(option.value)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: space.sm,
                    paddingHorizontal: space.md,
                    paddingVertical: 9,
                    backgroundColor: active ? tints.accentSoft : "transparent",
                  }}
                >
                  {option.color && <View style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: option.color
                    }} />}
                  <Text style={{
                      color: active ? colors.accentBright : colors.textDim,
                      fontSize: font.size.body,
                      fontWeight: active ? "800" : "600"
                    }}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
}
