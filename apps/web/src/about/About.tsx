import { colors, shadow, font } from "@grip/core/tokens";
import { t } from "@grip/core/i18n";
import { BrandIcon } from "../components/BrandIcon";
import { startTour } from "./tour";
import hover from "../components/HoverCard.module.css";
import { NextUpLink } from "../components/NextUpShell";

type TKey = Parameters<typeof t>[0];

type FeatureCardProps = {
  index: number;
  icon: string;
  color: string;
  titleKey: TKey;
  taglineKey: TKey;
  bulletKeys: TKey[];
  page: string;
  onNavigate: (page: string) => void;
};

function FeatureCard({ index, icon, color, titleKey, taglineKey, bulletKeys, page, onNavigate }: FeatureCardProps) {
  return (
    <article
      className={hover.hoverCard}
      style={{
        background: `linear-gradient(180deg, ${colors.surface}, ${colors.well})`,
        border: `1px solid ${colors.borderSoft}`,
        borderRadius: 8,
        boxShadow: shadow.card,
        padding: "18px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        minHeight: 280,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 8,
            background: `${color}18`,
            border: `1px solid ${color}30`,
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          <BrandIcon name={icon} color={color} size={18} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: font.size.label, fontWeight: 800, color, textTransform: "uppercase", marginBottom: 4 }}>
            {t("about.step", { number: index + 1 })}
          </div>
          <h2 style={{ margin: 0, fontSize: font.size.bodyLg, fontWeight: 800, color: colors.textBright }}>{t(titleKey)}</h2>
          <p style={{ margin: "4px 0 0", fontSize: font.size.small, color: colors.textFaint, lineHeight: 1.45 }}>{t(taglineKey)}</p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {bulletKeys.map((b) => (
          <div key={b} style={{ display: "grid", gridTemplateColumns: "10px 1fr", gap: 8, alignItems: "start" }}>
            <span
              aria-hidden="true"
              style={{
                width: 5,
                height: 5,
                marginTop: 7,
                borderRadius: 999,
                background: color,
                boxShadow: `0 0 12px ${color}40`,
              }}
            />
            <span style={{ fontSize: font.size.body, color: colors.textDim, lineHeight: 1.5 }}>{t(b)}</span>
          </div>
        ))}
      </div>

      <button
        onClick={() => onNavigate(page)}
        style={{
          marginTop: "auto",
          alignSelf: "flex-start",
          padding: "7px 14px",
          background: `${color}18`,
          border: `1px solid ${color}40`,
          borderRadius: 8,
          color,
          fontSize: font.size.small,
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        {t("about.open")}
      </button>
    </article>
  );
}

const FEATURES: Omit<FeatureCardProps, "index" | "onNavigate">[] = [
  {
    icon: "layers",
    color: "#818CF8",
    titleKey: "about.prep.title",
    taglineKey: "about.prep.tagline",
    page: "prep",
    bulletKeys: ["about.prep.b1", "about.prep.b2", "about.prep.b3", "about.prep.b4", "about.prep.b5", "about.prep.b6"],
  },
  {
    icon: "story",
    color: "#4ADE80",
    titleKey: "about.stories.title",
    taglineKey: "about.stories.tagline",
    page: "stories",
    bulletKeys: ["about.stories.b1", "about.stories.b2", "about.stories.b3", "about.stories.b4", "about.stories.b5"],
  },
  {
    icon: "board",
    color: "#FBBF24",
    titleKey: "about.board.title",
    taglineKey: "about.board.tagline",
    page: "board",
    bulletKeys: ["about.board.b1", "about.board.b2", "about.board.b3", "about.board.b4", "about.board.b5"],
  },
  {
    icon: "quest",
    color: "#38BDF8",
    titleKey: "about.quest.title",
    taglineKey: "about.quest.tagline",
    page: "quest",
    bulletKeys: ["about.quest.b1", "about.quest.b2", "about.quest.b3", "about.quest.b4", "about.quest.b5"],
  },
  {
    icon: "profile",
    color: "#A78BFA",
    titleKey: "about.profile.title",
    taglineKey: "about.profile.tagline",
    page: "profile",
    bulletKeys: ["about.profile.b1", "about.profile.b2", "about.profile.b3", "about.profile.b4", "about.profile.b5"],
  },
];

const QUICK_START: { labelKey: TKey; detailKey: TKey }[] = [
  { labelKey: "about.quickStart.prepLabel", detailKey: "about.quickStart.prepDetail" },
  { labelKey: "about.quickStart.storiesLabel", detailKey: "about.quickStart.storiesDetail" },
  { labelKey: "about.quickStart.questLabel", detailKey: "about.quickStart.questDetail" },
];

export default function About({ onNavigate }: { onNavigate: (page: string) => void }) {
  return (
    <main style={{ maxWidth: 1120, margin: "0 auto", padding: "34px 24px 60px" }}>
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
          gap: 18,
          alignItems: "stretch",
          marginBottom: 18,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: 20,
            padding: "24px",
            background: `linear-gradient(135deg, ${colors.surface}, ${colors.bgDeep})`,
            border: `1px solid ${colors.borderSoft}`,
            borderRadius: 8,
            boxShadow: shadow.card,
            minHeight: 260,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: colors.accentBright, fontSize: font.size.label, fontWeight: 800, marginBottom: 10 }}>
              <BrandIcon name="spark" color={colors.accentBright} size={14} />
              {t("about.kicker")}
            </div>
            <h1 style={{ margin: 0, fontSize: font.size.display, fontWeight: 800, color: colors.textBright }}>{t("about.title")}</h1>
            <p style={{ margin: "10px 0 0", fontSize: font.size.body, color: colors.textDim, maxWidth: 640, lineHeight: 1.65 }}>
              {t("about.intro")}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={() => startTour(onNavigate)}
              data-tour="nav-about"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 16px",
                background: colors.accent,
                border: "none",
                borderRadius: 8,
                color: colors.onAccent,
                fontSize: font.size.body,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              <BrandIcon name="spark" color={colors.onAccent} size={15} />
              {t("about.startTour")}
            </button>
            <NextUpLink label={t("about.startPrep")} onClick={() => onNavigate("prep")} />
          </div>
        </div>

        <aside
          style={{
            padding: "20px",
            background: colors.surface,
            border: `1px solid ${colors.borderSoft}`,
            boxShadow: shadow.card,
            borderRadius: 8,
          }}
        >
          <h2 style={{ margin: "0 0 14px", color: colors.textBright, fontSize: font.size.body, fontWeight: 800 }}>{t("about.quickStartTitle")}</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {QUICK_START.map((item, index) => (
              <div key={item.labelKey} style={{ display: "grid", gridTemplateColumns: "28px 1fr", gap: 10 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    display: "grid",
                    placeItems: "center",
                    background: `${colors.accent}18`,
                    color: colors.accentBright,
                    border: `1px solid ${colors.accent}35`,
                    fontSize: font.size.small,
                    fontWeight: 800,
                  }}
                >
                  {index + 1}
                </div>
                <div>
                  <div style={{ color: colors.textBright, fontSize: font.size.body, fontWeight: 800 }}>{t(item.labelKey)}</div>
                  <div style={{ color: colors.textDim, fontSize: font.size.small, lineHeight: 1.5, marginTop: 3 }}>{t(item.detailKey)}</div>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 280px), 1fr))",
          gap: 16,
        }}
      >
        {FEATURES.map((f, index) => (
          <FeatureCard key={f.page} index={index} {...f} onNavigate={onNavigate} />
        ))}
      </div>

      <div
        style={{
          marginTop: 32,
          padding: "18px 22px",
          background: colors.surface,
          border: `1px solid ${colors.borderSoft}`,
          boxShadow: shadow.card,
          borderRadius: 8,
        }}
      >
        <div style={{ fontSize: font.size.body, fontWeight: 800, color: colors.textBright, marginBottom: 10 }}>{t("about.howItWorks")}</div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 12,
          }}
        >
          {[
            { labelKey: "about.how.syncedLabel", detailKey: "about.how.syncedDetail" },
            { labelKey: "about.how.offlineLabel", detailKey: "about.how.offlineDetail" },
            { labelKey: "about.how.adaptiveLabel", detailKey: "about.how.adaptiveDetail" },
            { labelKey: "about.how.privateLabel", detailKey: "about.how.privateDetail" },
          ].map((item) => (
            <div key={item.labelKey}>
              <div style={{ fontSize: font.size.small, fontWeight: 800, color: colors.accent, marginBottom: 4 }}>{t(item.labelKey as Parameters<typeof t>[0])}</div>
              <div style={{ fontSize: font.size.small, color: colors.textDim, lineHeight: 1.5 }}>{t(item.detailKey as Parameters<typeof t>[0])}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
