'use client'


import React, { useState, useEffect } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { BRAND_STORY } from '../constants';

import { SocialPost } from '../types';

const StatCard = ({ title, value, hint, icon, color }: { title: string; value: number | null; hint?: string; icon: string; color: string }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-${color.split('-')[1]}-600`}>
        <i className={`fa-solid ${icon} text-xl`}></i>
      </div>
    </div>
    <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
    <p className="text-2xl font-bold text-slate-800 mt-1">{value === null ? '—' : value.toLocaleString()}</p>
    {hint && <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-2">{hint}</p>}
  </div>
);

type Overview = {
  days: number;
  totals: { impressions: number | null; engagement: number; clicks: number; leads: number };
  trend: { date: string; engagement: number; clicks: number; leads: number }[];
  platforms: { provider: string; accountName: string | null; connected: boolean; followers: number | null }[];
  posts: { total: number; byStatus: Record<string, number> };
  counties: { county: string; contacts: number }[];
  syncHealth: { lastFailureAt: string; error: string | null } | null;
};

interface DashboardProps {
  scheduledPosts?: SocialPost[];
}

const Dashboard: React.FC<DashboardProps> = ({ scheduledPosts = [] }) => {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [realTimeMetrics, setRealTimeMetrics] = useState<any[]>([]);

  const loadOverview = async () => {
    try {
      setLoadError(null);
      const res = await fetch('/api/admin/social-os/overview?days=30', { cache: 'no-store' });
      if (!res.ok) throw new Error(`Overview request failed (${res.status})`);
      setOverview(await res.json());
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Unable to load live metrics');
    }
  };

  useEffect(() => {
    void loadOverview();
  }, []);

  const fetchRealTimeMetrics = async () => {
    const published = scheduledPosts.filter(p => p.status === 'published');
    if (published.length === 0) return;

    const results = await Promise.all(published.map(async (post) => {
      try {
        const res = await fetch(`/api/social/metrics?platform=${post.platform}&postId=${post.id}`);
        if (res.ok) {
          const metrics = await res.json();
          return { ...post, realMetrics: metrics };
        }
      } catch { }
      return post;
    }));
    setRealTimeMetrics(results.filter(r => r.realMetrics));
  };

  useEffect(() => {
    void fetchRealTimeMetrics()
  }, [scheduledPosts]); // eslint-disable-line react-hooks/exhaustive-deps

  // Ensure Recharts doesn't render until the container is ready
  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex justify-between items-end">
        <header>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Legacy Pulse</h1>
          <p className="text-slate-500 font-medium">{BRAND_STORY.tagline} {BRAND_STORY.hashtag}</p>
        </header>
        <button
          onClick={() => void loadOverview()}
          className="text-xs font-bold text-slate-400 hover:text-[#C49A6C] transition-colors flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50"
        >
          <i className="fa-solid fa-rotate"></i>
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-slate-900/20">
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="space-y-4">
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C49A6C]">Mission Grounding</span>
               <h2 className="text-3xl font-black leading-tight max-w-lg">Protecting what matters. Building legacies that outlive them.</h2>
               <p className="text-slate-400 text-sm leading-relaxed max-w-md italic">
                 "{BRAND_STORY.origin}"
               </p>
            </div>
            <div className="pt-8 flex items-center gap-6">
              <p className="text-[11px] font-black uppercase tracking-widest text-[#C49A6C]">
                {overview
                  ? `${overview.platforms.filter(p => p.connected).length} of ${overview.platforms.length} platforms connected · ${overview.posts.total} posts logged`
                  : 'Loading live platform status…'}
              </p>
            </div>
          </div>
          <div className="absolute top-0 right-0 p-12 opacity-10">
             <i className="fa-solid fa-shield-heart text-[240px]"></i>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-center">
           <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Regional Focus</h3>
           <div className="space-y-4">
              {['Schuylkill', 'Luzerne', 'Northumberland'].map(name => {
                const count = overview?.counties.find(c => c.county === name)?.contacts ?? 0;
                return (
                  <div key={name} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <span className="text-sm font-bold text-slate-700">{name}</span>
                    <span className="text-xs font-black text-[#C49A6C]">{overview ? `${count} contact${count === 1 ? '' : 's'}` : '—'}</span>
                  </div>
                );
              })}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Impressions" value={overview?.totals.impressions ?? null} hint={overview?.totals.impressions == null ? 'Awaiting platform sync' : 'Last 30 days'} icon="fa-eye" color="bg-blue-500" />
        <StatCard title="Engagement" value={overview ? overview.totals.engagement : null} hint="Last 30 days" icon="fa-heart" color="bg-rose-500" />
        <StatCard title="Social Clicks" value={overview ? overview.totals.clicks : null} hint="Last 30 days" icon="fa-arrow-pointer" color="bg-amber-500" />
        <StatCard title="Leads" value={overview ? overview.totals.leads : null} hint="Last 30 days" icon="fa-user-plus" color="bg-indigo-500" />
      </div>

      {loadError && (
        <p className="text-xs font-bold text-rose-500">Live metrics unavailable: {loadError}</p>
      )}
      {overview?.syncHealth && (
        <p className="text-xs font-bold text-amber-600">
          Platform metrics sync last failed {new Date(overview.syncHealth.lastFailureAt).toLocaleString()}: {overview.syncHealth.error}
        </p>
      )}

      {realTimeMetrics.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
             <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">Live Post Intelligence</h2>
             <div className="h-[1px] flex-1 bg-slate-100"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {realTimeMetrics.map((post, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white text-xs">
                      <i className={`fa-brands fa-${post.platform}`}></i>
                    </div>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{post.platform} Active Post</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 font-medium line-clamp-2 italic">"{post.content}"</p>
                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-50">
                   <div className="text-center">
                      <p className="text-lg font-black text-slate-800">{post.realMetrics?.likes || 0}</p>
                      <p className="text-[8px] font-black uppercase text-slate-400 tracking-tighter">Likes</p>
                   </div>
                   <div className="text-center">
                      <p className="text-lg font-black text-slate-800">{post.realMetrics?.comments || 0}</p>
                      <p className="text-[8px] font-black uppercase text-slate-400 tracking-tighter">Talk</p>
                   </div>
                   <div className="text-center">
                      <p className="text-lg font-black text-slate-800">{post.realMetrics?.shares || 0}</p>
                      <p className="text-[8px] font-black uppercase text-slate-400 tracking-tighter">Reach</p>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Wrapping div with min-width to fix Recharts width calculations */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden min-w-0">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Engagement Trajectory</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Measuring the beat of the community</p>
          </div>
          <div className="flex gap-2">
             <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-[#C49A6C]"></div>
                <span className="text-[10px] font-bold text-slate-500">Engagement</span>
             </div>
             <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-[#2C3E50]"></div>
                <span className="text-[10px] font-bold text-slate-500">Clicks</span>
             </div>
          </div>
        </div>
        <div className="h-80 w-full min-w-0" style={{ minHeight: '320px' }}>
          {overview && overview.trend.length > 0 && isMounted ? (
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
              <LineChart data={overview?.trend ?? []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  fontWeight="bold"
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                />
                <YAxis stroke="#94a3b8" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
                />
                <Line type="monotone" dataKey="engagement" stroke="#C49A6C" strokeWidth={4} dot={false} activeDot={{ r: 6, fill: '#C49A6C' }} />
                <Line type="monotone" dataKey="clicks" stroke="#2C3E50" strokeWidth={4} dot={false} activeDot={{ r: 6, fill: '#2C3E50' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : !isMounted ? (
            <div className="h-full flex items-center justify-center text-slate-200">
               <i className="fa-solid fa-spinner fa-spin text-3xl"></i>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-300 flex-col gap-4">
              <i className="fa-solid fa-chart-line text-5xl"></i>
              <p className="font-medium uppercase tracking-widest text-xs">No Signal Detected</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
