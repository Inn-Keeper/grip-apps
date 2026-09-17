import { createApi } from "@grip/core/api";
import { supabase } from "./supabase";

export const api = createApi(supabase);
