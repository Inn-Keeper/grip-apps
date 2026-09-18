import { Fragment, type CSSProperties } from "react";
import { t } from "@grip/core/i18n";
import { computeReadiness } from "@grip/core/readiness";
import { colors, font } from "@grip/core/tokens";
import { BrandIcon } from "../components/BrandIcon";
import { categoryIconName } from "../components/brandIconNames";
import { WorkspacePanel, WorkspaceTitle } from "../components/WorkspaceLayout";
import type { Category, GithubStatus, PrepItem, Scores } from "./types";
import styles from "./InterviewPrep.module.css";

function categoryAnswered(cat: Category, scores: Scores) {
  return cat.items.filter((item) => scores.answers[item.tech]?.correct || scores.answers[item.tech]?.wrong).length;
}

export function PrepLeftRail({ locked, pendingCategory, categoryError, activeCategoryName, allItems, categories, githubStatus, scores, search, setSearch, onCategory, onCategoryDrill }: {
  activeCategoryName: string;
  allItems: PrepItem[];
  categories: Category[];
  githubStatus: GithubStatus;
  scores: Scores;
  search: string;
  setSearch: (s: string) => void;
  onCategory: (name: string) => void;
  onCategoryDrill: (categoryName: string) => void;
  // A session is running: the rail can't switch or start anything until it ends.
  locked: boolean;
  // The category whose drill is loading, and a failed category drill's message.
  pendingCategory: string | null;
  categoryError: { name: string; message: string } | null;
}) {
  return (
    <>
      {locked && (
        <p role="status" style={{ margin: 0, padding: "0 4px", color: colors.textDim, fontSize: font.size.small, fontWeight: 600 }}>
          {t("prep.railLocked")}
        </p>
      )}
      <div inert={locked} style={{ display: "flex", flexDirection: "column", gap: 14, opacity: locked ? 0.45 : 1, transition: "opacity 200ms ease" }}>
        <WorkspacePanel>
          <WorkspaceTitle
            icon={<BrandIcon name="layers" color={colors.accentBright} size={17} />}
            title={t("prep.practiceMap")}
            subtitle={t("prep.practiceMapSubtitle", { count: allItems.length })}
          />
          <div style={{ position: "relative", marginTop: 14 }}>
            <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", display: "flex" }}>
              <BrandIcon name="search" color={colors.textFaint} size={13} />
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("prep.searchTechnology")}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "9px 10px 9px 32px",
                background: colors.bgDeep,
                border: `1px solid ${colors.borderSoft}`,
                borderRadius: 8,
                color: colors.text,
                fontSize: font.size.body,
                outline: "none",
              }}
            />
          </div>
        </WorkspacePanel>

        <WorkspacePanel style={{ padding: 8 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {categories.map((cat) => {
              const active = activeCategoryName === cat.name && !search.trim();
              const answered = categoryAnswered(cat, scores);
              // Mastery, not coverage: average accuracy across the category, untested techs as 0.
            const pct = computeReadiness({ postingTechs: cat.items.map((item) => item.tech), answers: scores.answers }).prep ?? 0;
              const loading = pendingCategory === cat.name;
              return (
                <Fragment key={cat.name}>
                  <div className={styles.catRow} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <button
                      onClick={() => onCategory(cat.name)}
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: 9,
                        padding: "9px 10px",
                        border: "none",
                        borderRadius: 7,
                        background: active ? `${cat.color}24` : "transparent",
                        color: active ? colors.textBright : colors.textDim,
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <BrandIcon name={categoryIconName(cat.name)} color={active ? cat.color : colors.textFaint} size={15} />
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: "block", fontSize: font.size.body, fontWeight: 700 }}>{cat.name}</span>
                        <span style={{ display: "block", marginTop: 3, color: colors.textFaint, fontSize: font.size.label }}>
                          {t("prep.touched", { answered, total: cat.items.length })}
                        </span>
                      </span>
                      <span title={t("prep.masteryHint")} style={{ width: 34, textAlign: "right", color: pct > 0 ? cat.color : colors.textFaint, fontSize: font.size.label, fontWeight: 800 }}>
                        {pct}%
                      </span>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onCategoryDrill(cat.name); }}
                      className={styles.catDrill}
                      data-active={active}
                      aria-busy={loading}
                      title={t("prep.drillCategory", { category: cat.name })}
                      style={{
                        flexShrink: 0,
                        padding: "5px 8px",
                        border: `1px solid ${cat.color}40`,
                        borderRadius: 6,
                        background: "transparent",
                        color: cat.color,
                        fontSize: font.size.caption,
                        fontWeight: 700,
                        cursor: "pointer",
                        letterSpacing: "0.03em",
                        "--cat-color": `${cat.color}99`,
                        "--cat-shine": `${cat.color}B3`,
                      } as CSSProperties}
                    >
                      {loading ? "…" : t("prep.drill")}
                    </button>
                  </div>
                  {categoryError?.name === cat.name && (
                    <p role="alert" style={{ margin: "0 10px 4px", color: colors.warningBright, fontSize: font.size.label }}>{categoryError.message}</p>
                  )}
                </Fragment>
              );
            })}
          </div>
        </WorkspacePanel>

        {githubStatus?.enabled && githubStatus?.hasUrl && (
          <WorkspacePanel tone="sunken" style={{ color: colors.textFaint, fontSize: font.size.small, lineHeight: 1.5 }}>
            {githubStatus.loading
              ? t("github.loading")
              : githubStatus.error
                ? t("github.error")
                : githubStatus.count
                  ? t("github.matched", { count: githubStatus.count })
                  : t("github.noMatch")}
          </WorkspacePanel>
        )}
      </div>
    </>
  );
}
