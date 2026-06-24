-- Migration: add_spec_event_types
-- SPEC-HARDENING §6 — add named funnel and GBP event types to EventType enum
-- These events are fired by the education funnel and public tracker.

ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'legacy_checkup_started';
ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'legacy_checkup_step_completed';
ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'legacy_checkup_completed';
ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'lead_submitted';
ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'book_consultation_clicked';
ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'instant_quote_clicked';
ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'service_card_clicked';
ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'gbp_service_visit';
