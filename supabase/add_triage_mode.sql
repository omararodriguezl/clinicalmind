-- Migration: add 'triage' to sessions mode check constraint
-- Run this in Supabase Dashboard → SQL Editor

ALTER TABLE public.sessions
  DROP CONSTRAINT IF EXISTS sessions_mode_check;

ALTER TABLE public.sessions
  ADD CONSTRAINT sessions_mode_check
  CHECK (mode IN ('army', 'civilian', 'triage'));
