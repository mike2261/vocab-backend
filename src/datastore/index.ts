import { Kysely } from "kysely";
import type { DB } from "./d1/index";
import { D1Dialect } from "./d1/kysely-d1";

export type { DB };

export function initDB_D1(env: Env): Kysely<DB> {
  return new Kysely<DB>({
    dialect: new D1Dialect({ database: env.DB_D1 }),
  });
}
