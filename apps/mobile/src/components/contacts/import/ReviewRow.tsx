import { useState } from "react";
import { Pressable, Switch, Text, TextInput, View } from "react-native";
import type { ReviewRow as ImportRow } from "@grip/core/importReview";
import { STATUSES } from "@grip/core/contacts";
import { categories } from "@grip/core/prepData";
import { t } from "@grip/core/i18n";
import { colors, font, radius, space } from "@/theme";
import { Field, inputStyle } from "@/components/ui";
import { Combobox } from "@/components/Combobox";
import { DateField } from "@/components/DateField";

export function ReviewRow({ row, onChange }: { row: ImportRow; onChange: (patch: Partial<ImportRow>) => void }) {
  const [sourceOpen, setSourceOpen] = useState(false);
  const [techQuery, setTechQuery] = useState("");
  const techOptions = categories
    .flatMap((group: { items: { tech: string }[] }) => group.items.map(({ tech }) => tech))
    .filter((tech: string) => !row.postingTechs.includes(tech));
  return (
    <View style={{
        backgroundColor: colors.well,
        borderRadius: radius.sm,
        padding: space.lg,
        gap: space.lg
      }}>
      <View style={{
          flexDirection: "row",
          alignItems: "center",
          gap: space.sm,
          minHeight: 44
        }}>
        <Switch
          accessibilityLabel={t("quest.importIncludeNamed", { name: row.name || t("quest.importColName") })}
          value={row.included}
          onValueChange={(included) => onChange({ included })}
          trackColor={{ true: colors.accent }}
        />
        <Text style={{
            color: colors.textDim,
            fontSize: font.size.body
          }}>{t("quest.importInclude")}</Text>
      </View>
      <Field label={t("quest.importColName")}>
        <TextInput
          accessibilityLabel={t("quest.importColName")}
          style={inputStyle}
          value={row.name}
          onChangeText={(name) => onChange({ name })}
        />
      </Field>
      <Field label={t("quest.importColRole")}>
        <TextInput
          accessibilityLabel={t("quest.importColRole")}
          style={inputStyle}
          value={row.role}
          onChangeText={(role) => onChange({ role })}
        />
      </Field>
      <Combobox
        label={t("quest.importColStage")}
        value={row.status}
        options={STATUSES.map((status: string) => ({
          value: status,
          label: t(`enum.status.${status}` as Parameters<typeof t>[0]),
        }))}
        onChange={(status) => onChange({ status })}
      />
      <DateField
        label={t("quest.importColFollowUp")}
        value={row.nextActionDate}
        onChange={(nextActionDate) => onChange({ nextActionDate })}
        clearable
      />
      <Field label={t("quest.importTechs")}>
        <View style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: space.sm
          }}>
          {row.postingTechs.map((tech) => (
            <Pressable
              key={tech}
              accessibilityRole="button"
              accessibilityLabel={t("quest.importRemoveTech", { tech })}
              onPress={() => onChange({ postingTechs: row.postingTechs.filter((item) => item !== tech) })}
              style={{
                minHeight: 44,
                justifyContent: "center",
                paddingHorizontal: space.md,
                backgroundColor: colors.surfaceHi,
                borderRadius: radius.sm,
              }}
            >
              <Text style={{ color: colors.accentBright }}>{tech} ×</Text>
            </Pressable>
          ))}
        </View>
        {row.postingTechs.length < 5 && (
          <>
            <TextInput
              accessibilityLabel={t("contacts.addTech")}
              style={inputStyle}
              value={techQuery}
              onChangeText={setTechQuery}
              placeholder={t("contacts.addTech")}
              placeholderTextColor={colors.textDim}
            />
            {!!techQuery.trim() &&
              techOptions
                .filter((tech: string) => tech.toLowerCase().includes(techQuery.trim().toLowerCase()))
                .slice(0, 8)
                .map((tech: string) => (
                  <Pressable
                    key={tech}
                    accessibilityRole="button"
                    onPress={() => {
                      onChange({ postingTechs: [...row.postingTechs, tech] });
                      setTechQuery("");
                    }}
                    style={{
                      minHeight: 44,
                      justifyContent: "center"
                    }}
                  >
                    <Text style={{ color: colors.accentBright }}>{tech}</Text>
                  </Pressable>
                ))}
          </>
        )}
        <Text style={{
            color: colors.textDim,
            fontSize: font.size.small
          }}>{t("quest.importTechLimit")}</Text>
      </Field>
      {row.linkStatus && row.linkStatus !== "ok" && (
        <Text style={{ color: colors.textDim }}>{t("quest.importLinkFailed")}</Text>
      )}
      {!!row.warnings.length && (
        <Text
          accessibilityLiveRegion="polite"
          style={{
            color: colors.warningBright,
            fontSize: font.size.small
          }}
        >
          {row.warnings.map((warning) => t(`quest.importWarn.${warning}` as Parameters<typeof t>[0])).join(" · ")}
        </Text>
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: sourceOpen }}
        onPress={() => setSourceOpen(!sourceOpen)}
        style={{
          minHeight: 44,
          justifyContent: "center"
        }}
      >
        <Text style={{ color: colors.textDim }}>{t("quest.importSourceLabel")}</Text>
      </Pressable>
      {sourceOpen && (
        <Text
          selectable
          style={{ color: colors.textDim }}
        >
          {row.source}
        </Text>
      )}
    </View>
  );
}
