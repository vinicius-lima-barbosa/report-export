import { logger } from "@/shared/utils/logger";
import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

const SUPABASE_URL = env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
  },
});

logger.info("Supabase client initialized successfully.");
