import { categories } from "@grip/core/prepData";
import { addTech } from "@grip/core/techList";
import { t } from "@grip/core/i18n";
import { colors, font } from "@grip/core/tokens";
import { Combobox } from "../components/Combobox";
import { TechChips } from "./TechChips";

type Category = { name: string; items: { tech: string }[] };

// Removable chips plus a catalog search to add one; only drillable techs can be saved.
export function TechPicker({
  label,
  techs,
  limit,
  onChange,
}: {
  label: string;
  techs: string[];
  limit: number;
  onChange: (techs: string[]) => void;
}) {
  const groups = (categories as Category[]).map((category) => ({
    label: category.name,
    options: category.items
      .filter((item) => !techs.includes(item.tech))
      .map((item) => ({ label: item.tech, value: item.tech })),
  }));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <TechChips label={label} techs={techs} onRemove={(tech) => onChange(techs.filter((item) => item !== tech))} />
      <Combobox
        label={t("contacts.addTech")}
        value=""
        options={groups}
        filterable
        disabled={techs.length >= limit}
        placeholder={t("contacts.addTech")}
        onChange={(tech) => onChange(addTech(techs, tech, limit))}
      />
      {limit === 5 && <span style={{ fontSize: font.size.small, color: colors.textDim }}>{t("quest.importTechLimit")}</span>}
    </div>
  );
}
