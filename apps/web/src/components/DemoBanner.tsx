import { t } from "@grip/core/i18n";
import { colors, font } from "@grip/core/tokens";
import { useLinkGitHubMutation } from "../profile/queries";
import { BrandIcon } from "./BrandIcon";

// Shown to anonymous (demo) sessions. Linking GitHub upgrades the same user, so demo progress is kept.
export function DemoBanner() {
  const link = useLinkGitHubMutation();

  return (
    <div
      role="status"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        flexWrap: "wrap",
        padding: "8px 24px",
        background: `${colors.accent}14`,
        borderBottom: `1px solid ${colors.accent}40`,
        fontSize: font.size.body,
        color: colors.text,
        position: "relative",
        zIndex: 1,
      }}
    >
      <span>{t("demo.banner")}</span>
      <button
        type="button"
        onClick={() => link.mutate()}
        disabled={link.isPending}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "5px 12px",
          background: colors.accent,
          border: "none",
          borderRadius: 8,
          color: colors.onAccent,
          fontSize: font.size.small,
          fontWeight: 700,
          cursor: link.isPending ? "wait" : "pointer",
          opacity: link.isPending ? 0.6 : 1,
        }}
      >
        <BrandIcon name="code" color={colors.onAccent} size={13} />
        {t("demo.keepProgress")}
      </button>
      {link.error && <span style={{ color: colors.dangerBright }}>{link.error.message}</span>}
    </div>
  );
}
