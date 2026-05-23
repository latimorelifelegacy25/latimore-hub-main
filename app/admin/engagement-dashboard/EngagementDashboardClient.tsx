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


// --- UI constants

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


// --- small helpers

function safeNumber(n: unknown, fallback = 0) {

  const x = Number(n);

  return Number.isFinite(x) ? x : fallback;

}

function isRecord(v: unknown): v is Record<string, unknown> {

  return !!v && typeof v === "object" && !Array.isArray(v);

}


// --- Executive UI building blocks

function ExecutiveKpi({

  label,

  value,

  note,

}: {

  label: string;

  value: string;

  note?: string;

}) {

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


function MiniBarRow({

  label,

  value,

  max,

  color,

}: {

  label: string;

  value: number;

  max: number;

  color: string;

}) {

  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;


  return (

    <div className="space-y-2">

      <div className="flex items-center justify-between gap-4">

        <div className="text-sm font-medium capitalize" style={{ color }}>

          {label}

        </div>

        <div className="text-sm text-muted-foreground tabular-nums">{value.toLocaleString()}</div>

      </div>

      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">

        <div

          className="h-full rounded-full transition-all"

          style={{ width: `${pct}%`, background: color }}

        />

      </div>

    </div>

  );

}


function TrendMiniBars({ trend }: { trend: TrendPoint[] }) {

  if (!trend?.length) {

    return <div className="text-sm text-muted-foreground py-10 text-center">No trend data yet.</div>;

  }

  const points = trend.slice(-21);

  const maxVal = Math.max(

    ...points.map((t) => t.reactions + t.comments + t.shares + t.clicks),

    1

  );


  return (

    <div className="h-28 flex items-end gap-1">

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


export default function EngagementDashboardClient() {

  const [data, setData] = useState<MetricsData | null>(null);

  const [days, setDays] = useState(30);

  const [platform, setPlatform] = useState("");

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

      if (platform) params.set("platform", platform);


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

    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

      {/* Executive header */}

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">

        <div className="space-y-1">

          <h1 className="text-2xl font-semibold tracking-tight">Engagement Intelligence</h1>

          <h1 className="text-2xl font-semibold tracking-tight">Engagement Intelligence</h1>
          {insightCount > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {insightCount} insight{insightCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
      <div className="text-sm text-muted-foreground">
        <span>hub.latimorelifelegacy.com</span>
      </div>
    </div>
    <WidgetShell data={data} />
  </div>
  );
}
