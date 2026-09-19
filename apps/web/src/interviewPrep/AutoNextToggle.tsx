import { t } from "@grip/core/i18n";
import { Switch } from "../components/Switch";
import { AUTO_NEXT_MS } from "./quizPrefs";
import { SettingSection } from "./SettingSection";

// Practice setting: after a correct answer the session moves on by itself.
export function AutoNextToggle({ autoNext, onAutoNext }: { autoNext: boolean; onAutoNext: (value: boolean) => void }) {
  return (
    <SettingSection
      title={t("prep.autoNext")}
      hint={t("prep.autoNextHint", { seconds: AUTO_NEXT_MS / 1000 })}
      right={<Switch checked={autoNext} label={t("prep.autoNext")} onChange={onAutoNext} />}
    />
  );
}
