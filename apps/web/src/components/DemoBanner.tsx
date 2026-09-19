import { t } from "@grip/core/i18n";
import { colors, font } from "@grip/core/tokens";
import { useLinkGitHubMutation } from "../profile/queries";
import { NextUpLink } from "./NextUpShell";

// One slim line on every screen: the whole app is a free demo, signed in or not.
// Anonymous visitors also get a small link to sign in with GitHub (it upgrades the same user).
export function DemoBanner({ anonymous }: { anonymous: boolean }) {
  const link = useLinkGitHubMutation();

  return (
    <div
      role="note"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "2px 10px",
        flexWrap: "wrap",
        padding: "3px 16px",
        background: `${colors.accent}14`,
        borderBottom: `1px solid ${colors.accent}40`,
        fontSize: font.size.small,
        color: colors.textDim,
        position: "relative",
        zIndex: 1,
      }}
    >
      <span>{t("demo.bar")}</span>
      {anonymous && <NextUpLink label={t("auth.github")} onClick={() => link.mutate()} disabled={link.isPending} withOr={false} />}
      {link.error && <span style={{ color: colors.dangerBright }}>{link.error.message}</span>}
    </div>
  );
}
