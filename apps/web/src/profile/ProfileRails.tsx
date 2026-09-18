import { PROFILE_FIELDS } from "@grip/core/user";
import { t } from "@grip/core/i18n";
import { colors, font } from "@grip/core/tokens";
import { BrandIcon } from "../components/BrandIcon";
import { GlowBar } from "../components/GlowBar";
import { HeadlineMetric } from "../components/HeadlineMetric";
import { WorkspacePanel, WorkspaceTitle } from "../components/WorkspaceLayout";
import { SECTIONS, type ProfileSection } from "./sections";
import type { ProfileRecord, Rank } from "./types";

// Left rail = move around (rule 4): who you are, the sections, and signing out.
export function ProfileLeftRail({ profile, section, onSection, onSignOut }: {
  profile: ProfileRecord | null;
  section: ProfileSection;
  onSection: (section: ProfileSection) => void;
  onSignOut?: () => void;
}) {
  return (
    <>
      <WorkspacePanel>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 20, background: colors.accent, color: colors.onAccent, display: "grid", placeItems: "center", fontSize: font.size.title, fontWeight: 800, flexShrink: 0 }}>
            {(profile?.displayName || profile?.email || "?").slice(0, 1).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: colors.textBright, fontSize: font.size.bodyLg, fontWeight: 800 }}>{profile?.displayName || t("profile.yourProfile")}</div>
            {/* Guests have no email: show it only when there is one, and "Loading" only while loading. */}
            {(profile?.email || !profile) && (
              <div style={{ marginTop: 2, color: colors.textFaint, fontSize: font.size.small, overflowWrap: "anywhere" }}>{profile?.email || t("profile.loading")}</div>
            )}
          </div>
        </div>
      </WorkspacePanel>

      <WorkspacePanel style={{ padding: 8 }}>
        <nav aria-label={t("profile.settings")} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {SECTIONS.map((item) => {
            const active = item.key === section;
            return (
              <button
                key={item.key}
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => onSection(item.key)}
                style={{
                  display: "flex", alignItems: "center", gap: 9, padding: "9px 10px", border: "none", borderRadius: 7,
                  background: active ? `${colors.accent}24` : "transparent",
                  color: active ? colors.textBright : colors.textDim, fontSize: font.size.body, fontWeight: 700, cursor: "pointer", textAlign: "left",
                }}
              >
                <BrandIcon name={item.icon} color={active ? colors.accentBright : colors.textFaint} size={15} />
                {t(item.labelKey)}
              </button>
            );
          })}
        </nav>
      </WorkspacePanel>

      <WorkspacePanel tone="sunken">
        <p style={{ margin: 0, color: colors.textFaint, fontSize: font.size.small, lineHeight: 1.5 }}>{t("profile.privateNote")}</p>
        {onSignOut && (
          <button
            type="button"
            onClick={onSignOut}
            style={{ marginTop: 12, width: "100%", padding: "9px 12px", background: "transparent", border: `1px solid ${colors.borderSoft}`, borderRadius: 8, color: colors.textDim, fontSize: font.size.small, fontWeight: 800, cursor: "pointer", textAlign: "left" }}
          >
            {t("profile.signOut")}
          </button>
        )}
      </WorkspacePanel>
    </>
  );
}

// Right rail = status (rule 5): the completion headline, then rank.
export function ProfileRightRail({ completionItems, completionPct, profile, rank, next }: {
  completionItems: number;
  completionPct: number;
  profile: ProfileRecord | null;
  rank: Rank;
  next?: Rank;
}) {
  const xp = profile?.xp ?? 0;
  const rankPct = next ? ((xp - rank.min) / (next.min - rank.min)) * 100 : 100;
  return (
    <WorkspacePanel>
      <HeadlineMetric
        label={t("profile.completionLabel")}
        value={completionPct}
        unit="%"
        pct={completionPct}
        hint={t("profile.fields", { filled: completionItems, total: PROFILE_FIELDS.length })}
      />
      <WorkspaceTitle
        icon={<BrandIcon name="rank" color={colors.accentBright} size={17} />}
        title={t(`enum.rank.${rank.name}` as Parameters<typeof t>[0])}
        subtitle={`${xp} XP`}
      />
      <GlowBar pct={rankPct} marginTop={14} />
      <p style={{ margin: "9px 0 0", color: colors.textFaint, fontSize: font.size.label }}>
        {next ? t("profile.xpToNext", { xp: next.min - xp, rank: t(`enum.rank.${next.name}` as Parameters<typeof t>[0]) }) : t("profile.topRank")}
      </p>
    </WorkspacePanel>
  );
}
