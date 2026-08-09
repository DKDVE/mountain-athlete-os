export interface ApiConfig {
  port: number;
  allowedOrigin: string;
  supabaseUrl: string;
  supabaseJwksUrl: string;
  supabaseJwtSecret: string;
  openrouterApiKey: string;
  openrouterModelDefault: string;
  openrouterModelPremium: string;
}

export function loadConfig(): ApiConfig {
  const port = Number(process.env.PORT ?? 3000);
  const allowedOrigin = process.env.ALLOWED_ORIGIN ?? 'http://localhost:5173';
  const supabaseUrl = process.env.SUPABASE_URL ?? '';
  const supabaseJwksUrl =
    process.env.SUPABASE_JWKS_URL ??
    (supabaseUrl ? `${supabaseUrl.replace(/\/$/, '')}/auth/v1/.well-known/jwks.json` : '');
  const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET ?? '';
  const openrouterApiKey = process.env.OPENROUTER_API_KEY ?? '';
  const openrouterModelDefault =
    process.env.OPENROUTER_MODEL_DEFAULT ?? process.env.OPENROUTER_MODEL ?? 'openrouter/free';
  const openrouterModelPremium =
    process.env.OPENROUTER_MODEL_PREMIUM ?? 'deepseek/deepseek-v4-flash';

  return {
    port,
    allowedOrigin,
    supabaseUrl,
    supabaseJwksUrl,
    supabaseJwtSecret,
    openrouterApiKey,
    openrouterModelDefault,
    openrouterModelPremium,
  };
}
