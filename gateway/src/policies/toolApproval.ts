/**
 * Tool-approval policy.
 *
 * Inspects request `extra.tools` (Anthropic / OpenAI tool-calling shape) and
 * blocks any tool whose name is not in the tenant's approved list. This is
 * the runtime enforcement leg of MCP governance: even if a model decides to
 * invoke a high-risk tool, the gateway refuses to forward the request.
 *
 * Approval lookup is delegated to the caller via the `isToolApproved` hook
 * so this file stays free of database dependencies. The hook receives the
 * tenant id and tool name and returns a boolean (or undefined to allow).
 *
 * Configuration:
 *   - `mode: "audit"` — log denied tools but allow the request through. Used
 *     during onboarding so customers see what would be blocked.
 *   - `mode: "enforce"` — block the request entirely.
 */

import type {
  LlmRequest,
  PolicyDecision,
  PolicyInput,
  RequestPolicy,
} from "../types.js";

export interface ToolApprovalConfig {
  mode: "audit" | "enforce";
  isToolApproved: (
    tenantId: string,
    toolName: string
  ) => Promise<boolean> | boolean;
}

interface DeclaredTool {
  name?: unknown;
}

function extractToolNames(request: LlmRequest): string[] {
  const out: string[] = [];
  const tools = (request.extra as { tools?: unknown } | undefined)?.tools;
  if (!Array.isArray(tools)) return out;
  for (const t of tools as DeclaredTool[]) {
    if (t && typeof t === "object" && typeof t.name === "string") {
      out.push(t.name);
    }
  }
  return out;
}

export function createToolApprovalPolicy(
  cfg: ToolApprovalConfig
): RequestPolicy {
  return async (input: PolicyInput): Promise<PolicyDecision> => {
    const names = extractToolNames(input.request);
    if (names.length === 0) return { kind: "allow" };
    const denied: string[] = [];
    for (const name of names) {
      const approved = await cfg.isToolApproved(input.ctx.tenantId, name);
      if (!approved) denied.push(name);
    }
    if (denied.length === 0) return { kind: "allow" };
    if (cfg.mode === "audit") {
      return {
        kind: "allow",
      };
    }
    return {
      kind: "block",
      reason: "tool_not_approved",
      detail: { tools: denied },
      status: 403,
    };
  };
}
