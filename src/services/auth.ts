import type { Kysely } from "kysely";
import type { DB } from "../datastore/d1/index";
import { AppError } from "../hxxp/error";
import { newUUID } from "../utils/uuid";

const OTP_EXPIRY_MS = 10 * 60 * 1000;

function generateOTP(): string {
  const buf = crypto.getRandomValues(new Uint8Array(4));
  const val = new DataView(buf.buffer).getUint32(0);
  return String(val % 1_000_000).padStart(6, "0");
}

export async function createOTP(db: Kysely<DB>, email: string): Promise<string> {
  await db.deleteFrom("email_otps").where("email", "=", email).execute();

  const code = generateOTP();
  const now = new Date().toISOString();
  await db
    .insertInto("email_otps")
    .values({
      id: newUUID(),
      email,
      code,
      expires_at: new Date(Date.now() + OTP_EXPIRY_MS).toISOString(),
      created_at: now,
    })
    .execute();

  return code;
}

export async function verifyOTP(db: Kysely<DB>, email: string, code: string): Promise<void> {
  const otp = await db
    .selectFrom("email_otps")
    .where("email", "=", email)
    .where("code", "=", code)
    .selectAll()
    .executeTakeFirst();

  if (!otp || new Date(otp.expires_at) < new Date()) {
    throw new AppError("Authn", "Invalid or expired code");
  }

  await db.deleteFrom("email_otps").where("id", "=", otp.id).execute();
}

export async function upsertUserByEmail(db: Kysely<DB>, email: string) {
  const existing = await db.selectFrom("users").where("email", "=", email).selectAll().executeTakeFirst();
  if (existing) return existing;

  const id = newUUID();
  const now = new Date().toISOString();
  const displayName = email.split("@")[0] ?? email;
  await db
    .insertInto("users")
    .values({ id, email, display_name: displayName, created_at: now, updated_at: now })
    .execute();

  return db.selectFrom("users").where("id", "=", id).selectAll().executeTakeFirstOrThrow();
}

export async function upsertUserByGoogle(
  db: Kysely<DB>,
  googleUser: { googleId: string; email: string; name: string; avatarUrl?: string | null },
) {
  const byGoogle = await db
    .selectFrom("users")
    .where("google_id", "=", googleUser.googleId)
    .selectAll()
    .executeTakeFirst();
  if (byGoogle) return byGoogle;

  const byEmail = await db.selectFrom("users").where("email", "=", googleUser.email).selectAll().executeTakeFirst();
  if (byEmail) {
    const now = new Date().toISOString();
    await db
      .updateTable("users")
      .set({
        google_id: googleUser.googleId,
        avatar_url: byEmail.avatar_url ?? googleUser.avatarUrl ?? null,
        updated_at: now,
      })
      .where("id", "=", byEmail.id)
      .execute();
    return { ...byEmail, google_id: googleUser.googleId };
  }

  const id = newUUID();
  const now = new Date().toISOString();
  await db
    .insertInto("users")
    .values({
      id,
      email: googleUser.email,
      google_id: googleUser.googleId,
      display_name: googleUser.name,
      avatar_url: googleUser.avatarUrl ?? null,
      created_at: now,
      updated_at: now,
    })
    .execute();

  return db.selectFrom("users").where("id", "=", id).selectAll().executeTakeFirstOrThrow();
}

export async function getUserById(db: Kysely<DB>, id: string) {
  return db
    .selectFrom("users")
    .where("id", "=", id)
    .select(["id", "email", "display_name", "avatar_url"])
    .executeTakeFirst();
}
