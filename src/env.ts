import { z } from "zod";

const normalize = (value: unknown) =>
  typeof value === "string" && value.trim().length === 0 ? undefined : value;

const requiredString = () =>
  z.preprocess(normalize, z.string().min(1, "Value is required"));

const optionalString = () =>
  z.preprocess(normalize, z.string().min(1)).optional();

const serverSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.preprocess(normalize, z.string().url()),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: requiredString(),
  SUPABASE_SERVICE_ROLE_KEY: requiredString(),

  // AI (Google AI Studio only)
  GOOGLE_AI_API_KEY: requiredString(),

  // Stripe
  STRIPE_SECRET_KEY: optionalString(),
  STRIPE_WEBHOOK_SECRET: optionalString(),
  STRIPE_SINGLE_PRICE_ID: optionalString(),
  STRIPE_TEAM_PRICE_ID: optionalString(),
  STRIPE_BROKER_PRICE_ID: optionalString(),

  // Environment
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  // App URL
  NEXT_PUBLIC_APP_URL: optionalString(),

  // Optional services
  DATALAB_API_KEY: optionalString(), // For OCR
  TAVILY_API_KEY: optionalString(),
});

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.preprocess(normalize, z.string().url()),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: requiredString(),
});

// Skip validation when explicitly requested, or on Vercel when required vars aren't yet configured
// (allows build to succeed; add env vars in Vercel dashboard for runtime)
const requiredVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "GOOGLE_AI_API_KEY",
] as const;
const hasRequiredVars = requiredVars.every((k) => {
  const v = process.env[k];
  return typeof v === "string" && v.trim().length > 0;
});
const skipValidation =
  process.env.SKIP_ENV_VALIDATION === "true" ||
  process.env.SKIP_ENV_VALIDATION === "1" ||
  (process.env.VERCEL === "1" && !hasRequiredVars);

const parseEnv = <T extends z.AnyZodObject>(
  schema: T,
  values: z.input<T>
): z.infer<T> => {
  if (skipValidation) {
    const result = schema.partial().safeParse(values);
    if (result.success) {
      return result.data as z.infer<T>;
    }

    return values as z.infer<T>;
  }

  return schema.parse(values);
};

export const env = {
  server: parseEnv(serverSchema, {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY,
    NODE_ENV: process.env.NODE_ENV,
    DATALAB_API_KEY: process.env.DATALAB_API_KEY,
    TAVILY_API_KEY: process.env.TAVILY_API_KEY,
  }),
  client: parseEnv(clientSchema, {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  }),
};
