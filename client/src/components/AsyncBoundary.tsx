/**
 * Universal async boundary for any tRPC / fetch query.
 *
 * Renders one of three states:
 *   - loading  → <Skeleton /> (configurable via `fallback` prop)
 *   - error    → ErrorState with retry button
 *   - data     → children rendered with the resolved data
 *
 * Use this in lieu of repeating loading/error blocks in every page.
 */
import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface AsyncQueryLike<T> {
  isPending?: boolean;
  isLoading?: boolean;
  isError: boolean;
  error: { message?: string } | null | unknown;
  data: T | undefined;
  refetch?: () => Promise<unknown>;
}

interface AsyncBoundaryProps<T> {
  query: AsyncQueryLike<T>;
  /** Optional overridable fallback. Defaults to a 4-row skeleton block. */
  fallback?: React.ReactNode;
  /** Optional override for the empty-data state. Defaults to "No data". */
  empty?: React.ReactNode;
  /** Treat empty arrays / null / undefined as the "empty" state. */
  isEmpty?: (data: T) => boolean;
  /** Render the resolved data. */
  children: (data: T) => React.ReactNode;
}

export function AsyncBoundary<T>({
  query,
  fallback,
  empty,
  isEmpty,
  children,
}: AsyncBoundaryProps<T>): React.ReactElement {
  const loading = query.isPending ?? query.isLoading ?? false;
  if (loading) {
    return (
      <>
        {fallback ?? (
          <div className="space-y-3 p-4">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        )}
      </>
    );
  }
  if (query.isError) {
    const message =
      (query.error as { message?: string })?.message ??
      "Something went wrong loading this view.";
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
          <div className="flex-1 space-y-2">
            <p className="text-sm font-medium text-destructive">
              Failed to load
            </p>
            <p className="text-sm text-muted-foreground">{message}</p>
            {query.refetch && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  void query.refetch?.();
                }}
              >
                <RefreshCw className="mr-2 h-3.5 w-3.5" />
                Retry
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }
  const data = query.data;
  if (data === undefined || data === null) {
    return <>{empty ?? <p className="text-sm text-muted-foreground p-4">No data.</p>}</>;
  }
  if (isEmpty && isEmpty(data)) {
    return <>{empty ?? <p className="text-sm text-muted-foreground p-4">No data.</p>}</>;
  }
  return <>{children(data)}</>;
}
