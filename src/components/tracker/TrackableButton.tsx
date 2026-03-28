'use client';
import React from 'react';
import { useTracker, TrackableEventType } from './TrackerProvider';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  eventType?: TrackableEventType;
  eventMetadata?: Record<string, unknown>;
  county?: string;
  productInterest?: string;
};

export function TrackableButton({ eventType = 'ctaclick', eventMetadata, county, productInterest, onClick, children, ...rest }: Props) {
  const { trackEvent } = useTracker();
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    trackEvent({ eventType, county, productInterest, metadata: { label: typeof children === 'string' ? children : undefined, ...eventMetadata } });
    onClick?.(e);
  };
  return <button {...rest} onClick={handleClick}>{children}</button>;
}
