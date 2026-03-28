'use client';
import React from 'react';
import Link from 'next/link';
import { useTracker, TrackableEventType } from './TrackerProvider';

type Props = React.ComponentPropsWithoutRef<typeof Link> & {
  eventType?: TrackableEventType;
  eventMetadata?: Record<string, unknown>;
  county?: string;
  productInterest?: string;
};

export function TrackableLink({ eventType = 'ctaclick', eventMetadata, county, productInterest, onClick, children, href, ...rest }: Props) {
  const { trackEvent } = useTracker();
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    trackEvent({ eventType, county, productInterest, metadata: { href: href.toString(), label: typeof children === 'string' ? children : undefined, ...eventMetadata } });
    onClick?.(e);
  };
  return <Link href={href} {...rest} onClick={handleClick}>{children}</Link>;
}
