export interface ApiConfig {
  port: number;
  allowedOrigin: string;
  supabaseJwtSecret: string;
}

export function loadConfig(): ApiConfig {
  const port = Number(process.env.PORT ?? 3000);
  const allowedOrigin = process.env.ALLOWED_ORIGIN ?? 'http://localhost:5173';
  const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET ?? '';

  return { port, allowedOrigin, supabaseJwtSecret };
}
