import React, { useState } from "react";
import { colors, tints } from "@grip/core/tokens";
import { WorkspaceLayout } from "../components/WorkspaceLayout";
import { PromptDrill } from "./PromptDrill";
import { StoryCard } from "./StoryCard";
import { StoryForm } from "./StoryForm";
import { StoryLeftRail } from "./StoryLeftRail";
import { StoryCoverage } from "./StoryCoverage";
import { EMPTY_FORM } from "./types";
import { useDeleteStoryMutation, useSaveStoryMutation, useStoriesQuery } from "./queries";
import type { Story, StoryForm as StoryFormType } from "./types";

export default function StoryBank() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [mode, setMode] = useState<"stories" | "drill">("stories");

  const { data: stories = null, error: loadError } = useStoriesQuery();
  const saveMutation = useSaveStoryMutation();
  const deleteMutation = useDeleteStoryMutation();

  const mutationError = saveMutation.error || deleteMutation.error;
  const error = loadError
    ? `Couldn't load stories: ${loadError.message}`
    : mutationError
      ? `Save failed: ${mutationError.message}`
      : null;

  const handleSave = (form: StoryFormType) => {
    if (!form.title.trim()) return;
    saveMutation.mutate({ ...form, id: editingId === "new" ? undefined : editingId ?? undefined });
    setEditingId(null);
  };

  const handleDelete = (s: Story) => {
    if (window.confirm(`Delete "${s.title}"?`)) deleteMutation.mutate(s.id);
  };

  const storyList = stories ?? [];

  return (
    <WorkspaceLayout
      mainLabel="Story bank"
      left={
        <StoryLeftRail
          canAdd={!!stories && editingId !== "new"}
          mode={mode}
          onAdd={() => setEditingId("new")}
          setMode={setMode}
          stories={storyList}
        />
      }
      right={<StoryCoverage stories={storyList} />}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 6 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: colors.textBright }}>
          {mode === "drill" ? "Drill prompts" : "Story Bank"}
        </h1>
        <span style={{ marginLeft: "auto", fontSize: 12, color: colors.textFaint, fontWeight: 500 }}>
          {stories ? `${stories.length} stories` : "loading…"}
        </span>
      </div>
      <p style={{ margin: "0 0 20px", color: colors.textFaint, fontSize: 13, maxWidth: 760, lineHeight: 1.6 }}>
        Your STAR stories for behavioral interviews. Aim for 8–10 covering different competencies — one real story can
        serve several prompts.
      </p>

      {error && (
        <div
          style={{
            marginBottom: 16,
            padding: "10px 14px",
            background: tints.dangerSoft,
            border: `1px solid ${colors.danger}60`,
            borderRadius: 10,
            color: colors.dangerBright,
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {mode === "drill" ? (
        <PromptDrill stories={storyList} />
      ) : (
        <>
          {editingId === "new" && (
            <div style={{ marginBottom: 16 }}>
              <StoryForm initial={EMPTY_FORM} onSave={handleSave} onCancel={() => setEditingId(null)} />
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {stories?.length === 0 && editingId !== "new" && (
              <p style={{ color: colors.textFaint, fontSize: 13, textAlign: "center", marginTop: 24 }}>
                No stories yet. Start with your best "impact" story — the one you'd tell if you could only tell one.
              </p>
            )}
            {stories?.map((s) =>
              editingId === s.id ? (
                <StoryForm key={s.id} initial={s} onSave={handleSave} onCancel={() => setEditingId(null)} />
              ) : (
                <StoryCard key={s.id} story={s} onEdit={() => setEditingId(s.id ?? null)} onDelete={() => handleDelete(s)} />
              )
            )}
          </div>
        </>
      )}
    </WorkspaceLayout>
  );
}
