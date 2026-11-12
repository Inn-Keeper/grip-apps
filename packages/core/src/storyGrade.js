// Client for grip-ai-api story grading, and the shape of a saved story grade.
import { TalkGradeError } from "./talkGrade.js";

export const STORY_SECTIONS = ["situation", "task", "action", "result"];

const ASSESSMENT_VERSION = 1;
const GRADED_FIELDS = ["competency", "title", ...STORY_SECTIONS];

/** The fields a grade depends on; editing any of them makes it stale. */
export function storyGradeInputs(story) {
  return Object.fromEntries(GRADED_FIELDS.map((field) => [field, story[field] ?? ""]));
}

/** What gets saved in stories.assessment. */
export function buildStoryAssessment(story, result) {
  return { version: ASSESSMENT_VERSION, inputs: storyGradeInputs(story), result };
}

/** The saved grade, or null when there is none or the story changed since. */
export function currentStoryGrade(story) {
  const saved = story?.assessment;
  if (!saved || saved.version !== ASSESSMENT_VERSION) return null;
  const now = storyGradeInputs(story);
  return GRADED_FIELDS.every((field) => saved.inputs?.[field] === now[field]) ? saved.result : null;
}

/**
 * Binds the story grading endpoint to a token provider, like createTalkGradeApi.
 *
 * @param {() => Promise<string | null | undefined>} getToken
 * @param {string} baseUrl
 */
export function createStoryGradeApi(getToken, baseUrl) {
  const url = `${baseUrl.trim().replace(/\/$/, "")}/api/v1/ai/grade-story`;

  /** @param {{ id: string, competency: string, title: string } & Record<string, unknown>} story */
  async function gradeStory(story) {
    const token = await getToken();
    if (!token) {
      throw new TalkGradeError("storyGrade: no auth token, user must be signed in", { code: "authentication_required" });
    }
    const { competency, title, ...sections } = storyGradeInputs(story);
    let response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ story_id: story.id, competency, title, sections }),
      });
    } catch (cause) {
      throw new TalkGradeError("storyGrade: the grading service is unreachable", { code: "provider_unavailable", cause });
    }
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const error = payload?.error ?? {};
      throw new TalkGradeError(error.message ?? `storyGrade: the request failed (HTTP ${response.status})`, {
        code: error.code,
        status: response.status,
        requestId: error.request_id,
      });
    }
    return payload;
  }

  return { gradeStory };
}
