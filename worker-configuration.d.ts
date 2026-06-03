/// <reference types="@cloudflare/workers-types" />

interface Env {
  DB: D1Database;
  // Secrets — set via: wrangler secret put <NAME>
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  OPENROUTER_API_KEY: string;
  // Optional — Google OAuth
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_CALLBACK_URL: string;
  GOOGLE_REDIRECT_FE_URL: string;
  // Vars
  CORS_ORIGIN: string;
}
