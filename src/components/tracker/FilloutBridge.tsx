'use client';
import { useEffect, useRef } from 'react';
import { buildFilloutParams } from '@/lib/lead';

/**
 * FilloutBridge
 * Injects lead_session_id + UTMs into a Fillout iframe src after mount.
 * Uses the same buildFilloutParams() that lib/lead.ts already provides.
 */
export function FilloutSessionBridge({ iframeSelector = 'iframe[src*="fillout.com"]' }: { iframeSelector?: string }) {
  const injectedRef = useRef(false);
  useEffect(() => {
    if (injectedRef.current) return;
    const inject = () => {
      const iframe = document.querySelector(iframeSelector) as HTMLIFrameElement | null;
      if (!iframe) return false;
      const params = buildFilloutParams();
      if (!params) return false;
      const src = new URL(iframe.src);
      new URLSearchParams(params).forEach((v, k) => src.searchParams.set(k, v));
      iframe.src = src.toString();
      injectedRef.current = true;
      return true;
    };
    if (!inject()) {
      const interval = setInterval(() => { if (inject()) clearInterval(interval); }, 200);
      const timeout = setTimeout(() => clearInterval(interval), 3000);
      return () => { clearInterval(interval); clearTimeout(timeout); };
    }
  }, [iframeSelector]);
  return null;
}

export function FilloutHiddenFields() {
  useEffect(() => {
    const params = buildFilloutParams();
    if (!params) return;
    const newParams = new URLSearchParams(window.location.search);
    new URLSearchParams(params).forEach((v, k) => newParams.set(k, v));
    window.history.replaceState({}, '', `${window.location.pathname}?${newParams.toString()}${window.location.hash}`);
  }, []);
  return null;
}
