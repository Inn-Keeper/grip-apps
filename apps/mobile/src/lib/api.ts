import { createApi } from "@grip/core/api";
import { createTalkGradeApi } from "@grip/core/talkGrade";
import { createLedgerImportApi } from "@grip/core/ledgerImport";
import { createPostingReaderApi } from "@grip/core/postingReader";
import { supabase } from "./supabase";

export const api = createApi(supabase);

// Null when EXPO_PUBLIC_AI_URL is unset: the talk track then hides grading, as on web.
const aiUrl = process.env.EXPO_PUBLIC_AI_URL ?? "";
const getToken = async () => (await supabase.auth.getSession()).data.session?.access_token ?? null;
export const talkGrade = aiUrl
  ? createTalkGradeApi(getToken, aiUrl)
  : null;
export const ledgerImport = aiUrl ? createLedgerImportApi(getToken, aiUrl) : null;
export const postingReader = aiUrl ? createPostingReaderApi(getToken, aiUrl) : null;
