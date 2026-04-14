-- ClinicalMind Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- CLIENTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  client_id_number TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('army', 'civilian')),
  diagnosis TEXT,
  general_notes TEXT,
  has_active_safety_plan BOOLEAN DEFAULT FALSE,
  rank TEXT,                  -- Army only
  unit TEXT,                  -- Army only
  chain_of_command TEXT,      -- Army only
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- SESSIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('army', 'civilian')),
  session_date TIMESTAMPTZ DEFAULT NOW(),
  transcription TEXT,
  soap_subjective TEXT,
  soap_objective TEXT,
  soap_assessment TEXT,
  soap_plan TEXT,
  raw_note TEXT,
  session_number INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- SAFETY PLANS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.safety_plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  warning_signs TEXT[],
  internal_coping TEXT[],
  social_contacts JSONB,
  people_to_ask JSONB,
  professional_contacts JSONB,
  environment_safety TEXT[],
  -- Army-specific fields
  weapon_access TEXT,
  weapon_storage TEXT,
  chaplain_name TEXT,
  chaplain_contact TEXT,
  chain_of_command_name TEXT,
  chain_of_command_contact TEXT,
  signed_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- USER SETTINGS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  default_mode TEXT DEFAULT 'civilian' CHECK (default_mode IN ('army', 'civilian')),
  openai_api_key TEXT,
  custom_army_prompt TEXT,
  custom_civilian_prompt TEXT,
  clinician_name TEXT,
  clinician_credentials TEXT,
  facility_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- DSM FAVORITES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.dsm_favorites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  disorder_code TEXT NOT NULL,
  disorder_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================

-- Clients
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own clients"
  ON public.clients FOR ALL
  USING (auth.uid() = user_id);

-- Sessions
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own sessions"
  ON public.sessions FOR ALL
  USING (auth.uid() = user_id);

-- Safety Plans
ALTER TABLE public.safety_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own safety plans"
  ON public.safety_plans FOR ALL
  USING (auth.uid() = user_id);

-- User Settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own settings"
  ON public.user_settings FOR ALL
  USING (auth.uid() = user_id);

-- DSM Favorites
ALTER TABLE public.dsm_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own favorites"
  ON public.dsm_favorites FOR ALL
  USING (auth.uid() = user_id);

-- ==========================================
-- INDEXES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_client_id ON public.sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_safety_plans_client_id ON public.safety_plans(client_id);
CREATE INDEX IF NOT EXISTS idx_dsm_favorites_user_id ON public.dsm_favorites(user_id);

-- ==========================================
-- UPDATED_AT TRIGGER
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_safety_plans_updated_at
  BEFORE UPDATE ON public.safety_plans
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
