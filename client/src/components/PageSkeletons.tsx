/**
 * Page-level loading skeletons.
 *
 * Each page that fetches data on mount can render the matching skeleton
 * while the underlying tRPC queries are pending. The shapes mirror the
 * real page layouts so the layout shift on content arrival is minimal.
 *
 * Components are small (4 short divs each) so the dashboard's first
 * paint stays fast.
 */
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

/**
 * Generic 4-card metrics grid placeholder. Used by Dashboard, KillSwitch,
 * TokenAnalytics — anywhere with a row of stat cards above a list.
 */
export function MetricsGridSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: cards }).map((_, i) => (
        <Card key={i} className="p-6 space-y-4" data-testid="metric-card-skeleton">
          <div className="flex items-center justify-between">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          <Skeleton className="h-8 w-full" />
        </Card>
      ))}
    </div>
  );
}

/**
 * List-row placeholder. `rows` controls how many rows to render.
 */
export function ListRowsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3" data-testid="list-rows-skeleton">
      {Array.from({ length: rows }).map((_, i) => (
        <Card key={i} className="p-4 flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-8 w-20" />
        </Card>
      ))}
    </div>
  );
}

/**
 * Dashboard skeleton: welcome heading + 4-card metrics grid + recent
 * scans list.
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-8" data-testid="dashboard-skeleton">
      <div className="space-y-2">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-4 w-96" />
      </div>
      <MetricsGridSkeleton cards={4} />
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <ListRowsSkeleton rows={4} />
      </div>
    </div>
  );
}

/**
 * Compliance skeleton: title + framework toggle + report area.
 */
export function ComplianceSkeleton() {
  return (
    <div className="space-y-8" data-testid="compliance-skeleton">
      <div className="space-y-2">
        <Skeleton className="h-9 w-80" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Card className="p-6 space-y-4">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </Card>
      <ListRowsSkeleton rows={6} />
    </div>
  );
}

/**
 * TokenAnalytics skeleton: 4 stat cards + line-chart placeholder + list.
 */
export function TokenAnalyticsSkeleton() {
  return (
    <div className="space-y-8" data-testid="token-analytics-skeleton">
      <div className="space-y-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-1/3" />
      </div>
      <MetricsGridSkeleton cards={4} />
      <Card className="p-6">
        <Skeleton className="h-64 w-full" />
      </Card>
      <ListRowsSkeleton rows={5} />
    </div>
  );
}

/**
 * Red-team skeleton: title + run-now button + 3-stat grid + history table.
 */
export function RedTeamSkeleton() {
  return (
    <div className="space-y-8" data-testid="redteam-skeleton">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>
      <MetricsGridSkeleton cards={3} />
      <Card className="p-6 space-y-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-32 w-full" />
      </Card>
      <ListRowsSkeleton rows={4} />
    </div>
  );
}

/**
 * KillSwitch skeleton: status banner + 3-stat grid + audit table.
 */
export function KillSwitchSkeleton() {
  return (
    <div className="space-y-8" data-testid="killswitch-skeleton">
      <div className="space-y-2">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <Card className="p-6 space-y-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-12 w-full" />
      </Card>
      <MetricsGridSkeleton cards={3} />
      <ListRowsSkeleton rows={6} />
    </div>
  );
}
