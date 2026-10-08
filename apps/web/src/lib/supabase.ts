import { createClient } from "@supabase/supabase-js";
import type { Database } from "@grip/core/api";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Missing Supabase config. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in apps/web/.env"
  );
}

export const supabase = createClient<Database>(url, anonKey);
