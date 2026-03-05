import { z } from "zod";

const envSchema = z.object({
  FOOTBALL_DATA_API_KEY: z.string().min(1).default(""),
  FOOTBALL_DATA_BASE_URL: z.string().url().default("https://api.football-data.org/v4"),
  JUVE_TEAM_ID: z.coerce.number().default(109),
  TIMEZONE: z.string().default("Europe/Rome"),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  USE_MOCK_DATA: z.coerce.boolean().default(false),
  APP_BASE_URL: z.string().url().optional()
});

export const env = envSchema.parse(process.env);

