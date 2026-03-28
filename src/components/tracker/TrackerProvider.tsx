'use client';

import React, { createContext, useContext, useEffect, useRef } from 'react';

export type TrackableEventType =
  | 'pageview' | 'ctaclick' | 'callclick' | 'textclick'
  | 'emailclick' | 'bookclick' | 'formsubmit'
  | 'leadmagnetdownload' | 'countyselected' | 'productselected';

type TrackEventInput = {
  eventType: TrackableEventType;
  pageUrl?: string;
  county?: string;
  productInterest?: string;
  metadata?: Record<string, unknown>;
};

type TrackerContextValue = {
  trackEvent: (event: TrackEventInput) => void;
  getSessionId: () => string | null;
};

const SESSION_KEY = 'llh_sid';
const HUB_API = process.env.NEXT_PUBLIC_HUB_API_URL ?? 'https://lifeandlegacy.vercel.app';
const TrackerContext = createContext<TrackerContextValue | null>(null);

export function useTracker() {
  const ctx = useContext(TrackerContext);
  if (!ctx) throw new Error('useTracker must be used within TrackerProvider');
  return ctx;
}

function readSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  const ls = localStorage.getItem(SESSION_KEY);
  if (ls) return ls;
  const match = document.cookie.match(/(?:^|;\s*)leadSessionId=([^;]+)/);
  return match ? match[1] : null;
}

function saveSessionId(id: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SESSION_KEY, id);
}

function getUtmParams() {
  const p = new URLSearchParams(window.location.search);
  return {
    source: p.get('utm_source'),
    medium: p.get('utm_medium'),
    campaign: p.get('utm_campaign'),
    term: p.get('utm_term'),
    content: p.get('utm_content'),
  };
}

async function postEvent(payload: Record<string, unknown>) {
  try {
    const res = await fetch(`${HUB_API}/api/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!res.ok) return;
    const data = await res.json();
    if (data?.sessionId) saveSessionId(data.sessionId);
  } catch { /* never throw */ }
}

export function TrackerProvider({ children }: { children: React.ReactNode }) {
  const hasTrackedPageview = useRef(false);

  useEffect(() => {
    if (hasTrackedPageview.current) return;
    hasTrackedPageview.current = true;
    void postEvent({
      eventType: 'pageview',
      pageUrl: window.location.pathname,
      referrer: document.referrer || null,
      leadSessionId: readSessionId(),
      ...getUtmParams(),
    });
  }, []);

  const trackEvent = (event: TrackEventInput) => {
    void postEvent({
      eventType: event.eventType,
      pageUrl: event.pageUrl ?? window.location.pathname,
      referrer: document.referrer || null,
      leadSessionId: readSessionId(),
      county: event.county ?? null,
      productInterest: event.productInterest ?? null,
      metadata: event.metadata ?? {},
      ...getUtmParams(),
    });
  };

  return (
    <TrackerContext.Provider value={{ trackEvent, getSessionId: readSessionId }}>
      {children}
    </TrackerContext.Provider>
  );
}
