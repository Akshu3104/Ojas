import { useMemo, useState } from "react";

import { trpc } from "../lib/trpc";

interface OpenApiOperation {
  summary?: string;
  operationId?: string;
  tags?: string[];
  security?: Array<Record<string, string[]>>;
  parameters?: Array<{
    name: string;
    in: string;
    required: boolean;
    schema: unknown;
    description?: string;
  }>;
  requestBody?: {
    required: boolean;
    content: Record<string, { schema: unknown }>;
  };
  responses: Record<string, { description: string; content?: unknown }>;
}

interface OpenApiSpec {
  openapi: string;
  info: { title: string; version: string; description: string };
  servers: Array<{ url: string; description?: string }>;
  paths: Record<string, Record<string, OpenApiOperation>>;
}

/**
 * /api-docs page — Swagger-style explorer for the live tRPC surface.
 *
 * The spec is fetched from `apiDocs.spec`, which walks the live router
 * at request time so the UI is always in sync with the running server.
 * Customers and integration partners can:
 *   - browse procedures grouped by domain (auth, alerts, policies, …)
 *   - read input + response schemas
 *   - see which procedures require an authenticated session
 *   - download the raw spec as JSON for codegen
 */
export default function ApiDocs() {
  const specQuery = trpc.apiDocs.spec.useQuery(undefined, {
    staleTime: 60 * 1000,
  });
  const [filter, setFilter] = useState("");
  const [openOp, setOpenOp] = useState<string | null>(null);

  const spec = specQuery.data as OpenApiSpec | undefined;

  const groups = useMemo(() => {
    if (!spec) return [];
    const map = new Map<
      string,
      Array<{ path: string; method: string; op: OpenApiOperation }>
    >();
    for (const [path, ops] of Object.entries(spec.paths)) {
      for (const [method, op] of Object.entries(ops)) {
        const tag = op.tags?.[0] ?? "general";
        const arr = map.get(tag) ?? [];
        arr.push({ path, method, op });
        map.set(tag, arr);
      }
    }
    const filtered = Array.from(map.entries())
      .map(([tag, items]) => ({
        tag,
        items: items
          .filter(i => {
            if (!filter) return true;
            const f = filter.toLowerCase();
            return (
              i.path.toLowerCase().includes(f) ||
              i.op.summary?.toLowerCase().includes(f) ||
              i.op.operationId?.toLowerCase().includes(f)
            );
          })
          .sort((a, b) => a.path.localeCompare(b.path)),
      }))
      .filter(g => g.items.length > 0)
      .sort((a, b) => a.tag.localeCompare(b.tag));
    return filtered;
  }, [spec, filter]);

  const onDownload = () => {
    if (!spec) return;
    const blob = new Blob([JSON.stringify(spec, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ojas-openapi.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (specQuery.isLoading) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <div className="animate-pulse text-gray-400">Loading API docs…</div>
      </div>
    );
  }
  if (specQuery.isError || !spec) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <div className="text-red-600">
          Failed to load OpenAPI spec.{" "}
          {specQuery.error?.message ?? "Try again later."}
        </div>
      </div>
    );
  }

  const totalOps = groups.reduce((sum, g) => sum + g.items.length, 0);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          {spec.info.title}
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          OpenAPI {spec.openapi} · v{spec.info.version} · {totalOps} procedures
          across {groups.length} domains
        </p>
        <p className="text-sm text-gray-600 mt-2 max-w-3xl">
          {spec.info.description}
        </p>

        <div className="mt-4 flex gap-3 items-center">
          <input
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Filter by path, summary, operationId…"
            className="flex-1 max-w-md px-3 py-2 border rounded text-sm"
          />
          <button
            onClick={onDownload}
            className="px-4 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-700"
          >
            Download JSON
          </button>
        </div>
      </header>

      <div className="space-y-6">
        {groups.map(g => (
          <section key={g.tag}>
            <h2 className="text-lg font-semibold text-gray-800 capitalize mb-2">
              {g.tag}
            </h2>
            <div className="border rounded divide-y">
              {g.items.map(item => {
                const id = `${item.method}:${item.path}`;
                const isOpen = openOp === id;
                const requiresAuth =
                  Array.isArray(item.op.security) && item.op.security.length > 0;
                return (
                  <div key={id}>
                    <button
                      type="button"
                      onClick={() => setOpenOp(isOpen ? null : id)}
                      className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50"
                    >
                      <span
                        className={
                          item.method === "get"
                            ? "px-2 py-0.5 text-xs font-mono uppercase rounded bg-blue-100 text-blue-800"
                            : "px-2 py-0.5 text-xs font-mono uppercase rounded bg-green-100 text-green-800"
                        }
                      >
                        {item.method}
                      </span>
                      <code className="text-sm flex-1 text-gray-700">
                        {item.path}
                      </code>
                      {requiresAuth && (
                        <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                          auth
                        </span>
                      )}
                      <span className="text-sm text-gray-500">
                        {item.op.summary ?? ""}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 bg-gray-50">
                        <h3 className="text-xs uppercase font-semibold text-gray-500 mt-2">
                          Operation ID
                        </h3>
                        <code className="text-sm">{item.op.operationId}</code>

                        {item.op.parameters && item.op.parameters.length > 0 && (
                          <>
                            <h3 className="text-xs uppercase font-semibold text-gray-500 mt-3">
                              Parameters
                            </h3>
                            <pre className="text-xs bg-white border p-2 rounded overflow-x-auto">
                              {JSON.stringify(item.op.parameters, null, 2)}
                            </pre>
                          </>
                        )}

                        {item.op.requestBody && (
                          <>
                            <h3 className="text-xs uppercase font-semibold text-gray-500 mt-3">
                              Request body
                            </h3>
                            <pre className="text-xs bg-white border p-2 rounded overflow-x-auto">
                              {JSON.stringify(
                                item.op.requestBody.content["application/json"]
                                  ?.schema,
                                null,
                                2
                              )}
                            </pre>
                          </>
                        )}

                        <h3 className="text-xs uppercase font-semibold text-gray-500 mt-3">
                          Responses
                        </h3>
                        <pre className="text-xs bg-white border p-2 rounded overflow-x-auto">
                          {JSON.stringify(item.op.responses, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
