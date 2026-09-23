// Thin binding of the shared data layer to this app's Supabase client.
import { createApi, dateToUi, dateToDb } from "@grip/core/api";
import { createPipelineApi } from "@grip/core/pipeline";
import { createTalkGradeApi } from "@grip/core/talkGrade";
import { supabase } from "./supabase";

const pipelineUrl = import.meta.env.VITE_PIPELINE_URL ?? "";
const aiUrl = import.meta.env.VITE_AI_URL ?? "";

const getToken = async () => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) console.warn("⚠️ No Supabase session. Sign in to use pipeline analytics");
  return token ?? null;
};

// Null when VITE_PIPELINE_URL is unset, like talkGrade below: the Quest rail
// drops the velocity panel rather than showing an error for a service that was
// never deployed.
const pipeline = pipelineUrl ? createPipelineApi(getToken, pipelineUrl) : null;

// Null when VITE_AI_URL is unset: grading is optional, and the board hides the
// action rather than offering a button that can only fail.
const talkGrade = aiUrl ? createTalkGradeApi(getToken, aiUrl) : null;

const api = createApi(supabase);

export { dateToUi, dateToDb, pipeline, talkGrade };
export const {
  listBoards,
  listBoardSummaries,
  getBoard,
  upsertBoard,
  deleteBoard,
  setBoardSharing,
  getSharedBoard,
  getReviewQueue,
  listCustomScenarios,
  upsertCustomScenario,
  deleteCustomScenario,
  listStatusEvents,
  getAccuracyTimeline,
  listContacts,
  upsertContact,
  deleteContact,
  addRetro,
  deleteRetro,
  listStories,
  upsertStory,
  deleteStory,
  getScores,
  getQuestions,
  recordAnswer,
  addXp,
  resetScores,
  getUser,
  updateProfile
} = api;
