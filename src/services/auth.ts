import type { Kysely } from "kysely";
import type { DB } from "../datastore/d1/index";
import { AppError } from "../hxxp/error";
import { hashPassword, verifyPassword } from "../utils/crypto";
import { newUUID } from "../utils/uuid";

export async function registerUser(
  db: Kysely<DB>,
  input: { email: string; password: string; displayName?: string | null },
) {
  const existing = await db.selectFrom("users").where("email", "=", input.email).select("id").executeTakeFirst();
  if (existing) throw new AppError("Exist", "Email already in use");

  const passwordHash = await hashPassword(input.password);
  const id = newUUID();
  const now = new Date().toISOString();

  await db
    .insertInto("users")
    .values({
      id,
      email: input.email,
      password_hash: passwordHash,
      display_name: input.displayName ?? null,
      created_at: now,
      updated_at: now,
    })
    .execute();

  return { id, email: input.email, display_name: input.displayName ?? null, created_at: now };
}

export async function loginUser(db: Kysely<DB>, input: { email: string; password: string }) {
  const user = await db
    .selectFrom("users")
    .where("email", "=", input.email)
    .select(["id", "email", "display_name", "password_hash"])
    .executeTakeFirst();

  if (!user?.password_hash) return null;

  const valid = await verifyPassword(input.password, user.password_hash);
  if (!valid) return null;

  return { id: user.id, email: user.email, display_name: user.display_name };
}

export async function getUserById(db: Kysely<DB>, id: string) {
  return db
    .selectFrom("users")
    .where("id", "=", id)
    .select(["id", "email", "display_name", "avatar_url"])
    .executeTakeFirst();
}

export async function findOrCreateGoogleUser(
  db: Kysely<DB>,
  googleUser: { googleId: string; email: string; displayName?: string | null; avatarUrl?: string | null },
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
      display_name: googleUser.displayName ?? null,
      avatar_url: googleUser.avatarUrl ?? null,
      created_at: now,
      updated_at: now,
    })
    .execute();

  return { id, email: googleUser.email, google_id: googleUser.googleId, display_name: googleUser.displayName ?? null };
}
