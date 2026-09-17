import { createApi } from "@grip-apps/core/api";
import { supabase } from "./supabase";

export const api = createApi(supabase);
