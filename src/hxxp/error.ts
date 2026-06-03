import { NoResultError } from "kysely";

export type AppErrorCode =
  | "Authn"
  | "Authz"
  | "NotExist"
  | "Exist"
  | "Invalid"
  | "Validation"
  | "Database"
  | "Service"
  | "Other";

const HTTP_CODES: Record<AppErrorCode, number> = {
  Authn: 401,
  Authz: 403,
  NotExist: 404,
  Exist: 409,
  Invalid: 400,
  Validation: 400,
  Database: 500,
  Service: 500,
  Other: 500,
};

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly httpCode: number;

  constructor(code: AppErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "AppError";
    this.code = code;
    this.httpCode = HTTP_CODES[code];
  }
}

export function appErrorToBody(err: AppError) {
  return { error: { code: err.code, message: err.message } };
}

export function wrapError(err: Error): AppError {
  if (err instanceof AppError) {
    return err;
  }
  if (err.message.includes("D1_ERROR: UNIQUE constraint failed")) {
    return new AppError("Exist", "Already exists", { cause: err });
  }
  if (err.message.includes("D1_ERROR")) {
    return new AppError("Database", err.message, { cause: err });
  }
  if (err instanceof NoResultError) {
    return new AppError("NotExist", err.message, { cause: err });
  }
  return new AppError("Other", err.message, { cause: err });
}
