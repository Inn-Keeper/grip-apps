// Thin binding of the shared data layer to this app's Supabase client.
import { createApi, dateToUi, dateToDb } from "@grip-apps/core/api";
import { createPipelineApi, PipelineApiError } from "@grip-apps/core/pipeline";
import { supabase } from "./supabase";

const pipelineUrl = import.meta.env.VITE_PIPELINE_URL ?? "";

const getToken = async () => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) console.warn("⚠️ No Supabase session — sign in to use pipeline analytics");
  return token ?? null;
};

const pipeline = pipelineUrl
  ? createPipelineApi(getToken, pipelineUrl)
  : { async getVelocity(): Promise<never> { throw new PipelineApiError("pipeline: not configured"); } };

const api = createApi(supabase);

export { dateToUi, dateToDb, pipeline };
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
