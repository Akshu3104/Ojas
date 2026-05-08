import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from "@shared/const";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import type { TrpcContext } from "./context";
import {
  type AppErrorCode,
  type FormattedTrpcError,
  isAppError,
  toTRPCError,
} from "./errors";

/**
 * tRPC error normalization
 * ────────────────────────
 * Every procedure runs through {@link errorBoundary}, which:
 *
 *   1. Lets {@link TRPCError} pass through unchanged (already structured).
 *   2. Converts any {@link AppError} into a {@link TRPCError} with the
 *      correct typed code + a safe message — see `toTRPCError`.
 *   3. Treats anything else as an unexpected internal error: returns a
 *      generic INTERNAL_SERVER_ERROR to the client and preserves the
 *      original error as `cause` so onError + Sentry get the full stack.
 *
 * Combined with the {@link errorFormatter} below, clients receive a
 * structured payload like:
 *
 *     {
 *       message: "Collection not found",
 *       data: {
 *         code: "NOT_FOUND",
 *         httpStatus: 404,
 *         appCode: "NOT_FOUND",
 *         path: "collections.byId"
 *       }
 *     }
 */
const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }): FormattedTrpcError {
    const cause = error.cause;
    const appCode: AppErrorCode | undefined = isAppError(cause)
      ? cause.code
      : undefined;

    // Surface zod issues only for validation failures so the client
    // can render per-field errors. Everything else goes to logs.
    const zodIssues =
      cause instanceof ZodError ? cause.flatten() : undefined;

    return {
      ...shape,
      data: {
        ...shape.data,
        appCode,
        zodIssues,
      },
    };
  },
});

const errorBoundary = t.middleware(async ({ next }) => {
  try {
    return await next();
  } catch (err) {
    // Already structured — re-throw untouched.
    if (err instanceof TRPCError) throw err;
    // Domain error → typed TRPCError. Unknown error → safe 500.
    throw toTRPCError(err);
  }
});

export const router = t.router;

/**
 * Public procedure. Anyone (logged in or not) may call it. The error
 * boundary still runs so unexpected throws don't leak internals.
 */
export const publicProcedure = t.procedure.use(errorBoundary);

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure
  .use(errorBoundary)
  .use(requireUser);

export const editorProcedure = t.procedure.use(errorBoundary).use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }

    if (ctx.user.role !== "admin" && ctx.user.role !== "editor") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Collection not found or access denied",
      });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  })
);

export const adminProcedure = t.procedure.use(errorBoundary).use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  })
);
