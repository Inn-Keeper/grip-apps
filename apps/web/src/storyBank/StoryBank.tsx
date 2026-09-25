import { useEffect, useState } from "react";
import { COMPETENCIES } from "@grip/core/stories";
import { t } from "@grip/core/i18n";
import { colors, font } from "@grip/core/tokens";
import { NextUpLink, NextUpShell } from "../components/NextUpShell";
import { WorkspaceLayout } from "../components/WorkspaceLayout";
import { workspaceFocusStyle } from "../components/fieldStyles";
import { PromptDrill } from "./PromptDrill";
import { StoryCard, StoryDetail } from "./StoryCard";
import { StoryForm } from "./StoryForm";
import { StoryLeftRail, type StoryMode } from "./StoryLeftRail";
import { StoryCoverage } from "./StoryCoverage";
import { EMPTY_FORM } from "./types";
import { useDeleteStoryMutation, useSaveStoryMutation, useStoriesQuery } from "./queries";
import type { Story, StoryForm as StoryFormType } from "./types";
import { scrollBehavior } from "../lib/motion";
import { ErrorBanner, ErrorText } from "../components/ErrorText";

// The focused view (rule 8): writing, editing or reading one story in place of the list.
type Focus = { mode: "detail" | "edit"; id: string } | { mode: "new"; competency?: string } | null;

export default function StoryBank() {
  const [mode, setMode] = useState<StoryMode>("stories");
  const [focus, setFocus] = useState<Focus>(null);
  // Confirmation after a change (rule 14); the story a failed save belongs to (rule 13).
  const [notice, setNotice] = useState<{ id: number; text: string } | null>(null);
  const [touched, setTouched] = useState<string | null>(null);

  const { data: stories = null, error: loadError } = useStoriesQuery();
  const saveMutation = useSaveStoryMutation();
  const deleteMutation = useDeleteStoryMutation();
  const mutationError = saveMutation.error || deleteMutation.error;
  const errorFor = (id: string | undefined) => (mutationError && touched === id ? t("stories.saveError", { message: mutationError.message }) : null);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: scrollBehavior() });
  }, [focus]);

  const announce = (text: string) => setNotice({ id: Date.now(), text });

  const handleSave = (form: StoryFormType) => {
    if (!form.title.trim()) return;
    const id = focus?.mode === "edit" ? focus.id : undefined;
    setTouched(id ?? "new");
    saveMutation.mutate({ ...form, id }, { onSuccess: () => announce(t("stories.saved", { title: form.title })) });
    setFocus(id ? { mode: "detail", id } : null);
  };

  const handleDelete = (story: Story) => {
    if (!window.confirm(t("stories.deleteMessage", { title: story.title }))) return;
    setTouched(story.id ?? null);
    deleteMutation.mutate(story.id, { onSuccess: () => announce(t("stories.deleted", { title: story.title })) });
    setFocus(null);
  };

  const storyList = stories ?? [];
  const focused = focus && focus.mode !== "new" ? storyList.find((s) => s.id === focus.id) ?? null : null;
  const switchMode = (next: StoryMode) => { setFocus(null); setMode(next); };

  // Next Up (rule 1): a first story → the first uncovered competency → rehearsal.
  const gap = COMPETENCIES.find((competency) => !storyList.some((s) => s.competency === competency));
  const covered = COMPETENCIES.filter((competency) => storyList.some((s) => s.competency === competency)).length;
  const competencyName = (key: string) => t(`enum.competency.${key}` as Parameters<typeof t>[0]);
  const nextUp =
    storyList.length === 0
      ? { title: t("stories.nextFirstTitle"), sub: t("stories.nextFirstSub"), action: t("stories.addStoryPlain"), icon: "story", onAction: () => setFocus({ mode: "new" }), links: null }
      : gap
        ? {
            title: t("stories.nextGapTitle", { competency: competencyName(gap) }),
            sub: t("stories.nextGapSub", { covered, total: COMPETENCIES.length }),
            action: t("stories.nextGapAction"),
            icon: "story",
            onAction: () => setFocus({ mode: "new", competency: gap }),
            links: <NextUpLink label={t("stories.orAdd")} onClick={() => setFocus({ mode: "new" })} />,
          }
        : { title: t("stories.nextDrillTitle"), sub: t("stories.nextDrillSub"), action: t("stories.nextDrillAction"), icon: "prompt", onAction: () => switchMode("drill"), links: <NextUpLink label={t("stories.orAdd")} onClick={() => setFocus({ mode: "new" })} /> };

  const noticeLine = notice && (
    <p key={notice.id} role="status" style={{ margin: "0 0 16px", color: colors.accentBright, fontSize: font.size.body, fontWeight: 700 }}>{notice.text}</p>
  );

  return (
    <WorkspaceLayout
      mainLabel={t("stories.title")}
      lockedHint={focus ? t("stories.lockedHint") : null}
      left={<StoryLeftRail mode={mode} setMode={switchMode} stories={storyList} />}
      right={<StoryCoverage stories={storyList} />}
    >
      {loadError && (
        <ErrorBanner>
          {t("stories.loadError", { message: loadError.message })}
        </ErrorBanner>
      )}

      {focus ? (
        <div style={workspaceFocusStyle}>
          <button type="button" onClick={() => setFocus(null)} style={{ marginBottom: 14, padding: 0, background: "transparent", border: "none", color: colors.accentBright, fontSize: font.size.body, fontWeight: 700, cursor: "pointer" }}>
            {t("stories.back")}
          </button>
          {noticeLine}
          {focus.mode === "new" && (
            <>
              <StoryForm initial={{ ...EMPTY_FORM, competency: focus.competency ?? EMPTY_FORM.competency }} onSave={handleSave} onCancel={() => setFocus(null)} />
              {errorFor("new") && <ErrorText>{errorFor("new")}</ErrorText>}
            </>
          )}
          {focused && focus.mode === "edit" && <StoryForm initial={focused} onSave={handleSave} onCancel={() => setFocus({ mode: "detail", id: focus.id })} />}
          {focused && focus.mode === "detail" && (
            <StoryDetail story={focused} error={errorFor(focused.id)} onEdit={() => setFocus({ mode: "edit", id: focus.id })} onDelete={() => handleDelete(focused)} />
          )}
        </div>
      ) : (
        <>
          {mode === "stories" && stories && (
            <NextUpShell title={nextUp.title} sub={nextUp.sub} tone={colors.accent ?? ""} actionLabel={nextUp.action} actionIcon={nextUp.icon} onAction={nextUp.onAction} links={nextUp.links} />
          )}

          <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 6 }}>
            <h1 style={{ margin: 0, fontSize: font.size.heading, fontWeight: 800, color: colors.textBright }}>
              {mode === "drill" ? t("stories.drillPrompts") : t("stories.title")}
            </h1>
            <span style={{ marginLeft: "auto", fontSize: font.size.small, color: colors.textFaint, fontWeight: 600 }}>
              {stories ? t("stories.count", { count: stories.length }) : t("common.loading")}
            </span>
          </div>
          {/* The list explains itself (coverage and Next Up sit beside it); drill mode keeps its one-line how-to. */}
          {noticeLine ?? (mode === "drill" && (
            <p style={{ margin: "0 0 16px", color: colors.textFaint, fontSize: font.size.body, maxWidth: 760, lineHeight: 1.6 }}>
              {t("stories.drillSubtitle")}
            </p>
          ))}

          {mode === "drill" ? (
            <PromptDrill stories={storyList} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {stories?.length === 0 && (
                <p style={{ color: colors.textFaint, fontSize: font.size.body, textAlign: "center", marginTop: 24 }}>{t("stories.empty")}</p>
              )}
              {stories?.map((s) => (
                <StoryCard
                  key={s.id}
                  story={s}
                  error={errorFor(s.id)}
                  onOpen={() => s.id && setFocus({ mode: "detail", id: s.id })}
                  onEdit={() => s.id && setFocus({ mode: "edit", id: s.id })}
                  onDelete={() => handleDelete(s)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </WorkspaceLayout>
  );
}
