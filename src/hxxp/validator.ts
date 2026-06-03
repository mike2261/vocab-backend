/** biome-ignore-all lint/complexity/noBannedTypes: ask hono */
import type { ArkErrors, Type } from "arktype";
import { type } from "arktype";
import type { Context, Env, MiddlewareHandler, TypedResponse, ValidationTargets } from "hono";
import { validator } from "hono/validator";
import { AppError } from "./error";

export type Hook<T, E extends Env, P extends string, O = {}> = (
  result: { success: false; data: unknown; errors: ArkErrors } | { success: true; data: T },
  c: Context<E, P>,
) => Response | Promise<Response> | undefined | Promise<Response | undefined> | TypedResponse<O>;

type HasUndefined<T> = undefined extends T ? true : false;

export const validate = <
  T extends Type,
  Target extends keyof ValidationTargets,
  E extends Env,
  P extends string,
  I = T["inferIn"],
  O = T["infer"],
  V extends {
    in: HasUndefined<I> extends true ? { [K in Target]?: I } : { [K in Target]: I };
    out: { [K in Target]: O };
  } = {
    in: HasUndefined<I> extends true ? { [K in Target]?: I } : { [K in Target]: I };
    out: { [K in Target]: O };
  },
>(
  target: Target,
  schema: T,
  hook?: Hook<T["infer"], E, P>,
): MiddlewareHandler<E, P, V> =>
  // @ts-expect-error not typed well
  validator(target, (value, c) => {
    const out = schema(value);
    const hasErrors = out instanceof type.errors;

    if (hook) {
      const hookResult = hook(
        hasErrors ? { success: false, data: value, errors: out } : { success: true, data: out },
        c,
      );
      if (hookResult) {
        if (hookResult instanceof Response || hookResult instanceof Promise) {
          return hookResult;
        }
        if ("response" in hookResult) {
          return hookResult.response;
        }
      }
    }

    if (hasErrors) {
      throw new AppError("Validation", out.map((err) => err.toString()).join("\n"));
    }

    return out;
  });

export function validateOrThrow<T extends Type>(schema: T, value: unknown): T["infer"] {
  const out = schema(value);
  const hasErrors = out instanceof type.errors;
  if (!hasErrors) {
    return out;
  }
  throw new AppError("Validation", out.map((err) => err.toString()).join("\n"));
}
