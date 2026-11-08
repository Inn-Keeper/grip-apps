import { t } from "@grip/core/i18n";
import { colors, font, tints } from "../lib/tokens";
import type { Story } from "./types";

const tag = { padding: "3px 10px", borderRadius: 20, fontSize: font.size.label, fontWeight: 700 } as const;

// Generated stories keep their playbook label; "Sample" stays until the user saves an edit.
export function FirstRunTags({ story }: { story: Story }) {
  return (
    <>
      {story.isSample && (
        <span title={t("firstRun.stories.sampleHint")} style={{
            ...tag,
            background: tints.warningSoft,
            color: colors.warningBright
          }}>
          {t("firstRun.stories.sample")}
        </span>
      )}
      {story.playbook && (
        <span style={{
            ...tag,
            background: colors.surfaceHi,
            color: colors.textDim
          }}>
          {t("firstRun.stories.playbook", { name: story.playbook })}
        </span>
      )}
    </>
  );
}
