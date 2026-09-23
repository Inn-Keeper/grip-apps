import { createApi } from "@grip/core/api";
import { createTalkGradeApi } from "@grip/core/talkGrade";
import { supabase } from "./supabase";

export const api = createApi(supabase);

// Null when EXPO_PUBLIC_AI_URL is unset: the talk track then hides grading, as on web.
const aiUrl = process.env.EXPO_PUBLIC_AI_URL ?? "";
export const talkGrade = aiUrl
  ? createTalkGradeApi(async () => (await supabase.auth.getSession()).data.session?.access_token ?? null, aiUrl)
  : null;
