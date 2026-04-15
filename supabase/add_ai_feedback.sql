-- Migration: add ai_feedback column to sessions table
-- Run this in Supabase Dashboard → SQL Editor

ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS ai_feedback TEXT;
