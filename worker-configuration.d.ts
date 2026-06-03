/// <reference types="@cloudflare/workers-types" />

interface Env {
  DB_D1: D1Database;
  // Secrets — set via: wrangler secret put <NAME>
  JWT_SECRET: string;
  RESEND_API_KEY: string;
  OPENROUTER_API_KEY: string;
  // Optional — Google Sign-In (id_token flow)
  GSI_CLIENT_ID: string;
  // Vars
  CORS_ORIGIN: string;
  APP_URL: string;
}
