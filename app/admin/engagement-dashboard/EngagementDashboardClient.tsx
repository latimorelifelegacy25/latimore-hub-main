"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ga4 } from "@/lib/analytics/ga4";

// shadcn/ui
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

type Totals = {
  impressions: number;
  reach: number;
  clicks: number;
  reactions: number;
  comments: number;
  shares: number;
  saves: number;
  leads: number;
};

type TrendPoint = {
  date: string;
  reactions: number;
  comments: number;
  shares: number;
  clicks: number;
};

type Insight = {
  id: string;
  type: string;
  severity: string;
  title: string;
  summary: string;
  action?: string;
  createdAt: string;
};

type Post = {
  id: string;
  platform: string;
  caption: string;
  publishedAt: string | null;
  metrics: { reactions: number; comments: number; shares: number; clicks: number; reach: number }[];
};

type MetricsData = {
  totals: Totals;
  byPlatform: Record<string, Totals>;
  trend: TrendPoint[];
  insights: Insight[];
  recentPosts: Post[];
  days: number;
};

const PLATFORM_COLORS: Record<string, string> = {
  facebook: "#1877F2",
  instagram: "#E1306C",
  linkedin: "#0A66C2",
  twitter: "#1DA1F2",
  website: "#C49A6C",
};

const SEVERITY_BADGE: Record<string, { label: string; className: string }> = {
  high: { label: "High", className: "bg-red-500/15 text-red-300 border-red-500/25" },
  medium: { label: "Medium", className: "bg-amber-500/15 text-amber-300 border-amber-500/25" },
  low: { label: "Low", className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25" },
  info: { label: "Info", className: "bg-sky-500/15 text-sky-300 border-sky-500/25" },
};

function safeNumber(n: unknown, fallback = 0) {
  const x = Number(n);
  return Number.isFinite(x) ? x : fallback;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function formatNumber(value: number | undefined) {
  return safeNumber(value).toLocaleString();
}

function metricTotal(post: Post, key: keyof Post["metrics"][number]) {
  return post.metrics?.reduce((sum, metric) => sum + safeNumber(metric[key]), 0) ?? 0;
}

function ExecutiveKpi({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold tracking-tight">{value}</div>
        {note && <div className="mt-1 text-xs text-muted-foreground">{note}</div>}
      </CardContent>
    </Card>
  );
}

function MiniBarRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm font-medium capitalize" style={{ color }}>
          {label}
        </div>
        <div className="text-sm text-muted-foreground tabular-nums">{value.toLocaleString()}</div>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function TrendMiniBars({ trend }: { trend: TrendPoint[] }) {
  if (!trend?.length) {
    return <div className="py-10 text-center text-sm text-muted-foreground">No trend data yet.</div>;
  }

  const points = trend.slice(-21);
  const maxVal = Math.max(...points.map((t) => t.reactions + t.comments + t.shares + t.clicks), 1);

  return (
    <div className="flex h-28 items-end gap-1">
      {points.map((t) => {
        const total = t.reactions + t.comments + t.shares + t.clicks;
        const h = Math.max((total / maxVal) * 100, 6);

        return (
          <div
            key={t.date}
            title={`${t.date}: ${total.toLocaleString()} engagements`}
            className="flex-1 rounded-sm"
            style={{
              height: `${h}%`,
              background: "linear-gradient(180deg, hsl(var(--primary)) 0%, rgba(196,154,108,0.85) 100%)",
              opacity: 0.9,
            }}
          />
        );
      })}
    </div>
  );
}

function LoadingDashboard() {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index} className="rounded-2xl">
          <CardHeader>
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-32" />
            <Skeleton className="mt-3 h-3 w-40" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function EngagementDashboardClient() {
  const [data, setData] = useState<MetricsData | null>(null);
  const [days, setDays] = useState(30);
  const [platform, setPlatform] = useState("all");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [sentimentText, setSentimentText] = useState("");
  const [sentimentResult, setSentimentResult] = useState<Record<string, unknown> | null>(null);
  const [sentimentLoading, setSentimentLoading] = useState(false);

  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [weeklyReport, setWeeklyReport] = useState<Record<string, unknown> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const params = new URLSearchParams({ days: String(days) });
      if (platform !== "all") params.set("platform", platform);

      const res = await fetch(`/api/social/metrics?${params}`, { cache: "no-store" });
      if (!res.ok) {
        setData(null);
        setLoadError(`Metrics request failed (${res.status}).`);
        return;
      }

      const json = (await res.json()) as MetricsData;
      setData(json);
    } catch {
      setData(null);
      setLoadError("Unable to load metrics.");
    } finally {
      setLoading(false);
    }
  }, [days, platform]);

  useEffect(() => {
    load();
    ga4.dashboardView("engagement_intelligence");
  }, [load]);

  async function runSentiment() {
    if (!sentimentText.trim()) return;

    setSentimentLoading(true);
    setSentimentResult(null);

    try {
      const res = await fetch("/api/ai/sentiment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: sentimentText }),
      });

      const json = await res.json();
      const result = isRecord(json?.result) ? (json.result as Record<string, unknown>) : null;
      setSentimentResult(result ?? { error: "No result returned" });
    } catch {
      setSentimentResult({ error: "Analysis failed" });
    } finally {
      setSentimentLoading(false);
    }
  }

  async function runWeeklyReport() {
    setWeeklyLoading(true);
    setWeeklyReport(null);

    try {
      const res = await fetch("/api/reports/weekly", { method: "POST" });
      const json = await res.json();
      const analysis = isRecord(json?.analysis) ? (json.analysis as Record<string, unknown>) : null;
      setWeeklyReport(analysis ?? { error: "No report returned" });
      ga4.reportGenerated("weekly");
    } catch {
      setWeeklyReport({ error: "Report failed" });
    } finally {
      setWeeklyLoading(false);
    }
  }

  const totals = data?.totals;

  const engRate = useMemo(() => {
    if (!totals || totals.reach <= 0) return "—";
    const rate = ((totals.reactions + totals.comments + totals.shares) / totals.reach) * 100;
    return `${rate.toFixed(1)}%`;
  }, [totals]);

  const platforms = useMemo(() => (data ? Object.keys(data.byPlatform || {}) : []), [data]);

  const maxPlatformReach = useMemo(() => {
    if (!data || platforms.length === 0) return 1;
    return Math.max(...platforms.map((p) => data.byPlatform[p]?.reach ?? 0), 1);
  }, [data, platforms]);

  const insightCount = data?.insights?.length ?? 0;

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-6 py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">Engagement Intelligence</h1>
            {insightCount > 0 && (
              <Badge variant="outline" className="bg-blue-100 text-blue-800">
                {insightCount} insight{insightCount !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">hub.latimorelifelegacy.com</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Select value={String(days)} onValueChange={(value) => setDays(Number(value))}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>

          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All platforms</SelectItem>
              {platforms.map((item) => (
                <SelectItem key={item} value={item}>
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={load} disabled={loading}>
            Refresh
          </Button>
        </div>
      </div>

      {loadError && (
        <Card className="rounded-2xl border-red-500/30 bg-red-500/5">
          <CardContent className="py-4 text-sm text-red-500">{loadError}</CardContent>
        </Card>
      )}

      {loading ? (
        <LoadingDashboard />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <ExecutiveKpi label="Reach" value={formatNumber(totals?.reach)} note={`${days}-day audience exposure`} />
            <ExecutiveKpi label="Clicks" value={formatNumber(totals?.clicks)} note="Traffic intent signals" />
            <ExecutiveKpi label="Engagement Rate" value={engRate} note="Reactions + comments + shares / reach" />
            <ExecutiveKpi label="Leads" value={formatNumber(totals?.leads)} note="CRM conversion events" />
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="ai">AI Tools</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-5">
                <Card className="rounded-2xl lg:col-span-3">
                  <CardHeader>
                    <CardTitle>Engagement Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TrendMiniBars trend={data?.trend ?? []} />
                  </CardContent>
                </Card>

                <Card className="rounded-2xl lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Reach by Platform</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {platforms.length ? (
                      platforms.map((item) => (
                        <MiniBarRow
                          key={item}
                          label={item}
                          value={data?.byPlatform[item]?.reach ?? 0}
                          max={maxPlatformReach}
                          color={PLATFORM_COLORS[item] ?? "#C49A6C"}
                        />
                      ))
                    ) : (
                      <div className="py-8 text-center text-sm text-muted-foreground">No platform data yet.</div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle>AI Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data?.insights?.length ? (
                    data.insights.map((insight) => {
                      const severity = SEVERITY_BADGE[insight.severity] ?? SEVERITY_BADGE.info;
                      return (
                        <div key={insight.id} className="rounded-xl border p-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="font-medium">{insight.title}</div>
                            <Badge variant="outline" className={severity.className}>
                              {severity.label}
                            </Badge>
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">{insight.summary}</p>
                          {insight.action && <p className="mt-3 text-sm font-medium">Action: {insight.action}</p>}
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-8 text-center text-sm text-muted-foreground">No AI insights generated yet.</div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="posts">
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle>Recent Posts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data?.recentPosts?.length ? (
                    data.recentPosts.map((post) => (
                      <div key={post.id} className="rounded-xl border p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <Badge variant="outline" className="capitalize">
                            {post.platform}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : "Draft / unscheduled"}
                          </span>
                        </div>
                        <p className="mt-3 line-clamp-3 text-sm">{post.caption}</p>
                        <Separator className="my-4" />
                        <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-5">
                          <div>Reach: {metricTotal(post, "reach").toLocaleString()}</div>
                          <div>Clicks: {metricTotal(post, "clicks").toLocaleString()}</div>
                          <div>Reactions: {metricTotal(post, "reactions").toLocaleString()}</div>
                          <div>Comments: {metricTotal(post, "comments").toLocaleString()}</div>
                          <div>Shares: {metricTotal(post, "shares").toLocaleString()}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-sm text-muted-foreground">No recent posts found.</div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ai" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle>Sentiment Analyzer</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      value={sentimentText}
                      onChange={(event) => setSentimentText(event.target.value)}
                      placeholder="Paste a comment, DM, review, or post caption..."
                      className="min-h-32"
                    />
                    <Button onClick={runSentiment} disabled={sentimentLoading || !sentimentText.trim()}>
                      {sentimentLoading ? "Analyzing..." : "Analyze Sentiment"}
                    </Button>
                    {sentimentResult && (
                      <pre className="max-h-80 overflow-auto rounded-xl bg-muted p-4 text-xs">
                        {JSON.stringify(sentimentResult, null, 2)}
                      </pre>
                    )}
                  </CardContent>
                </Card>

                <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle>Weekly Report</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Generate an executive summary for the current social and CRM reporting period.
                    </p>
                    <Button onClick={runWeeklyReport} disabled={weeklyLoading}>
                      {weeklyLoading ? "Generating..." : "Generate Weekly Report"}
                    </Button>
                    {weeklyReport && (
                      <pre className="max-h-80 overflow-auto rounded-xl bg-muted p-4 text-xs">
                        {JSON.stringify(weeklyReport, null, 2)}
                      </pre>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
