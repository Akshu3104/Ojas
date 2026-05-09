/**
 * MCP Governance — Sprint 2 scaffolding (read-only endpoints).
 *
 * Exposes the dashboard read paths over the three MCP tables so the frontend
 * can render the registry and permission graph. Mutations (register, approve,
 * disable) and the inline-enforcement loop land in Sprint 3 once the gateway's
 * MCP transport layer is wired.
 *
 * Why expose read endpoints alone now?
 *   - The data model is stable; building the frontend ahead of enforcement
 *     keeps Sprint 3 a pure backend cut.
 *   - Auditors asking about MCP governance posture during pre-sales can be
 *     shown an empty (but real) dashboard rather than a dead nav item.
 */
import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { eq, desc, and } from "drizzle-orm";
import {
  mcpServers,
  mcpTools,
  mcpInvocationLog,
} from "../../drizzle/schema";

export const mcpGovernanceRouter = router({
  // List all MCP servers registered to the current user.
  listServers: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { servers: [] };
    const rows = await db
      .select()
      .from(mcpServers)
      .where(eq(mcpServers.userId, ctx.user.id))
      .orderBy(desc(mcpServers.discoveredAt));
    return { servers: rows };
  }),

  // List tools exposed by a server, with their risk classification.
  listTools: protectedProcedure
    .input(z.object({ serverId: z.string().min(1).max(64) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { tools: [] };
      // Verify the server belongs to this user (BOLA prevention).
      const owner = await db
        .select({ id: mcpServers.id })
        .from(mcpServers)
        .where(
          and(
            eq(mcpServers.id, input.serverId),
            eq(mcpServers.userId, ctx.user.id)
          )
        )
        .limit(1);
      if (owner.length === 0) return { tools: [] };
      const rows = await db
        .select()
        .from(mcpTools)
        .where(eq(mcpTools.serverId, input.serverId));
      return { tools: rows };
    }),

  // Recent invocation log — drives the "permission graph" view's audit pane.
  recentInvocations: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().positive().max(500).default(100),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { invocations: [] };
      const rows = await db
        .select()
        .from(mcpInvocationLog)
        .where(eq(mcpInvocationLog.userId, ctx.user.id))
        .orderBy(desc(mcpInvocationLog.createdAt))
        .limit(input.limit);
      return { invocations: rows };
    }),

  // Aggregate stats for the governance dashboard tile.
  summary: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      return {
        totalServers: 0,
        activeServers: 0,
        unsafeTools: 0,
        invocations24h: 0,
      };
    }
    // 1. Server counts.
    const allServers = await db
      .select({ id: mcpServers.id, isActive: mcpServers.isActive })
      .from(mcpServers)
      .where(eq(mcpServers.userId, ctx.user.id));
    const totalServers = allServers.length;
    const activeServers = allServers.filter(s => s.isActive).length;

    // 2. Unsafe-tool counts (joined to keep it user-scoped).
    const userServerIds = allServers.map(s => s.id);
    let unsafeTools = 0;
    if (userServerIds.length > 0) {
      // Drizzle's `inArray` from drizzle-orm — we use a manual filter to
      // avoid pulling another import for a single use.
      for (const serverId of userServerIds) {
        const unsafeRows = await db
          .select({ id: mcpTools.id })
          .from(mcpTools)
          .where(
            and(
              eq(mcpTools.serverId, serverId),
              eq(mcpTools.riskClass, "unsafe")
            )
          );
        unsafeTools += unsafeRows.length;
      }
    }

    // 3. Last-24h invocation count.
    // We rely on JS-side filtering since Drizzle can't easily do
    // "last 24 hours" in our MySQL dialect without a subquery; volume here
    // is small (an individual user's invocation log).
    const recent = await db
      .select({ createdAt: mcpInvocationLog.createdAt })
      .from(mcpInvocationLog)
      .where(eq(mcpInvocationLog.userId, ctx.user.id));
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const invocations24h = recent.filter(
      r => r.createdAt && r.createdAt.getTime() >= cutoff
    ).length;

    return {
      totalServers,
      activeServers,
      unsafeTools,
      invocations24h,
    };
  }),
});
