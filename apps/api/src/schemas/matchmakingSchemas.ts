import { z } from "@hono/zod-openapi";

export const enqueueBodySchema = z.object({
  userId: z.string().min(1).openapi({
    example: "alice123",
  }),
  mode: z.enum(["1v1"]).optional().default("1v1").openapi({
    example: "1v1",
  }),
});

export const enqueueResponseQueuedSchema = z
  .object({
    status: z.literal("queued").openapi({ example: "queued" }),
    userId: z.string().openapi({ example: "alice123" }),
    mode: z.enum(["1v1"]).openapi({ example: "1v1" }),
  })
  .openapi({
    example: {
      status: "queued",
      userId: "alice123",
      mode: "1v1",
    },
  });

export const enqueueResponseMatchedSchema = z
  .object({
    status: z.literal("matched").openapi({ example: "matched" }),
    userId: z.string().openapi({ example: "bob456" }),
    opponent: z.object({
      userId: z.string().openapi({ example: "alice123" }),
    }),
    matchId: z
      .string()
      .openapi({ example: "550e8400-e29b-41d4-a716-446655440000" }),
  })
  .openapi({
    example: {
      status: "matched",
      userId: "bob456",
      opponent: { userId: "alice123" },
      matchId: "550e8400-e29b-41d4-a716-446655440000",
    },
  });

export const enqueueResponseConflictSchema = z
  .object({
    ok: z.literal(false).openapi({ example: false }),
    code: z.literal("ALREADY_IN_GAME").openapi({ example: "ALREADY_IN_GAME" }),
  })
  .openapi({
    example: { ok: false, code: "ALREADY_IN_GAME" },
  });

export const enqueueErrorSchema = z
  .object({
    ok: z.literal(false).openapi({ example: false }),
    code: z
      .enum(["INVALID_BODY", "SERVER_ERROR"])
      .openapi({ example: "INVALID_BODY" }),
    message: z.string().optional().openapi({ example: "userId is required" }),
    issues: z
      .any()
      .optional()
      .openapi({
        example: [{ path: ["userId"], message: "Invalid input" }],
      }),
  })
  .openapi({
    example: {
      ok: false,
      code: "INVALID_BODY",
      message: "userId is required",
      issues: [{ path: ["userId"], message: "Invalid input" }],
    },
  });

// runtime-only (not shown in Swagger)
export const dequeueBodySchemaRt = z.object({
  userId: z.string().min(1).openapi({ example: "alice123" }),
});

export const statusParamsSchema = z.object({
  userId: z.string().min(1).openapi({
    example: "SuperUser",
  }),
});

export const statusResponseSchema = z.union([
  z.object({ status: z.literal("idle").openapi({ example: "idle" }) }).openapi({
    example: { status: "idle" },
  }),
  z
    .object({ status: z.literal("queued").openapi({ example: "queued" }) })
    .openapi({
      example: { status: "queued" },
    }),
  z
    .object({
      status: z.literal("matched").openapi({ example: "matched" }),
      matchId: z
        .string()
        .openapi({ example: "550e8400-e29b-41d4-a716-446655440000" }),
      opponent: z.object({
        userId: z.string().openapi({ example: "bob456" }),
      }),
    })
    .openapi({
      example: {
        status: "matched",
        matchId: "550e8400-e29b-41d4-a716-446655440000",
        opponent: { userId: "bob456" },
      },
    }),
]);
