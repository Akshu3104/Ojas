/**
 * Red-team dashboard.
 *
 * Two pieces of UI new in Sprint 4:
 *  1. Per-page skeleton on first paint (vs. the layout-level skeleton
 *     that used to flash the whole sidebar).
 *  2. A score-trend sparkline that visualises securityScore across the
 *     last N completed runs. Click "Run now" to kick off an ad-hoc
 *     run; the sparkline updates after the mutation settles.
 */
import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Play, Activity } from "lucide-react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { RedTeamSkeleton } from "@/components/PageSkeletons";

interface SparklinePoint {
  index: number;
  score: number;
  finishedAt: string;
  status: string;
}

function avg(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((s, x) => s + x, 0) / xs.length;
}

export default function RedTeam() {
  const [target, setTarget] = useState("");
  const { data, isLoading, refetch } =
    trpc.runtimeGovernance.redteamRuns.useQuery({ limit: 50 });
  const startRun = trpc.runtimeGovernance.startRedteam.useMutation({
    onSuccess: () => {
      toast.success("Red-team run finished");
      refetch();
    },
    onError: err => toast.error(err.message),
  });

  const runs = data?.runs ?? [];
  const completed = runs.filter(r => r.status === "completed");

  const sparklinePoints: SparklinePoint[] = useMemo(() => {
    return completed
      .slice()
      .reverse() // oldest → newest for left-to-right chart
      .map((r, i) => ({
        index: i + 1,
        score: r.securityScore ?? 0,
        finishedAt: (r.finishedAt ?? r.createdAt).toString(),
        status: r.status,
      }));
  }, [completed]);

  const latestScore = completed[0]?.securityScore ?? null;
  const avgScore = Math.round(
    avg(completed.map(r => r.securityScore ?? 0))
  );
  const totalPayloadsScanned = runs.reduce(
    (s, r) => s + r.totalPayloads,
    0
  );

  if (isLoading && !data) return <RedTeamSkeleton />;

  return (
    <div className="space-y-8" data-testid="redteam-page">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Red Team</h1>
          <p className="text-muted-foreground">
            Adversarial prompt-injection runs against your gateway-attached
            target.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="https://your-app.example/api/chat"
            value={target}
            onChange={e => setTarget(e.target.value)}
            className="w-72"
            data-testid="redteam-target-input"
          />
          <Button
            onClick={() => startRun.mutate({ target })}
            disabled={!target || startRun.isPending}
            data-testid="redteam-run-button"
          >
            <Play className="w-4 h-4 mr-2" />
            {startRun.isPending ? "Running…" : "Run now"}
          </Button>
        </div>
      </div>

      {/* 3-stat grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              Latest score
            </p>
            <Shield className="w-5 h-5 text-accent" />
          </div>
          <p className="text-3xl font-bold">
            {latestScore === null ? "—" : `${latestScore}/100`}
          </p>
        </Card>
        <Card className="p-6 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              Avg score (last {completed.length})
            </p>
            <Activity className="w-5 h-5 text-accent" />
          </div>
          <p className="text-3xl font-bold">
            {completed.length === 0 ? "—" : `${avgScore}/100`}
          </p>
        </Card>
        <Card className="p-6 space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Payloads scanned
          </p>
          <p className="text-3xl font-bold">{totalPayloadsScanned}</p>
        </Card>
      </div>

      {/* Score-trend sparkline */}
      <Card className="p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Security score trend</h2>
          <span className="text-xs text-muted-foreground">
            Last {sparklinePoints.length} completed run
            {sparklinePoints.length === 1 ? "" : "s"}
          </span>
        </div>
        {sparklinePoints.length === 0 ? (
          <p className="text-sm text-muted-foreground py-12 text-center">
            No completed runs yet. Kick off a red-team run to populate the
            trend.
          </p>
        ) : (
          <div className="h-40" data-testid="redteam-sparkline">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklinePoints}>
                <XAxis dataKey="index" hide />
                <YAxis domain={[0, 100]} hide />
                <Tooltip
                  formatter={(v: number) => [`${v}/100`, "Score"]}
                  labelFormatter={(_, payload) =>
                    payload?.[0]?.payload?.finishedAt
                      ? new Date(
                          payload[0].payload.finishedAt
                        ).toLocaleString()
                      : ""
                  }
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Run history */}
      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-semibold">Run history</h2>
        {runs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No runs yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="py-2 pr-4">Started</th>
                  <th className="py-2 pr-4">Target</th>
                  <th className="py-2 pr-4">Trigger</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Payloads</th>
                  <th className="py-2 pr-4">Blocked</th>
                  <th className="py-2 pr-4">Score</th>
                </tr>
              </thead>
              <tbody>
                {runs.map(r => (
                  <tr key={r.id} className="border-t">
                    <td className="py-2 pr-4">
                      {new Date(r.createdAt as unknown as string).toLocaleString()}
                    </td>
                    <td className="py-2 pr-4 font-mono text-xs">
                      {r.target}
                    </td>
                    <td className="py-2 pr-4">{r.triggeredBy}</td>
                    <td className="py-2 pr-4">{r.status}</td>
                    <td className="py-2 pr-4">{r.totalPayloads}</td>
                    <td className="py-2 pr-4">{r.blockedCount}</td>
                    <td className="py-2 pr-4">
                      {r.securityScore === null ? "—" : `${r.securityScore}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
