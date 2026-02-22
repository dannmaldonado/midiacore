-- Initial Schema for MidiaCore

-- 1. Create companies table
CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('internal', 'client')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- 2. Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create contracts table
CREATE TABLE public.contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    shopping_name TEXT NOT NULL,
    media_type TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'pending', 'expired')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    contract_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
    responsible_person TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on contracts
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- 4. Create opportunities table
CREATE TABLE public.opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    shopping_name TEXT NOT NULL,
    stage TEXT NOT NULL,
    forecast_date DATE,
    contact_reference TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on opportunities
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

-- 5. Create contacts table
CREATE TABLE public.contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT,
    company_name TEXT,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on contacts
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- RLS POLICIES (Multi-tenant)
-- ==========================================

-- Helper function to get current user's company_id
CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Companies: Users can read their own company
CREATE POLICY "Users can view their own company" 
ON public.companies FOR SELECT 
USING (id = public.get_my_company_id());

-- Profiles: Users can view their own profile and profiles in their company
CREATE POLICY "Users can view profiles in their company" 
ON public.profiles FOR SELECT 
USING (company_id = public.get_my_company_id());

-- Contracts: CRUD based on company_id
CREATE POLICY "Company dynamic access for contracts" 
ON public.contracts FOR ALL
USING (company_id = public.get_my_company_id())
WITH CHECK (company_id = public.get_my_company_id());

-- Opportunities: CRUD based on company_id
CREATE POLICY "Company dynamic access for opportunities" 
ON public.opportunities FOR ALL
USING (company_id = public.get_my_company_id())
WITH CHECK (company_id = public.get_my_company_id());

-- Contacts: CRUD based on company_id
CREATE POLICY "Company dynamic access for contacts" 
ON public.contacts FOR ALL
USING (company_id = public.get_my_company_id())
WITH CHECK (company_id = public.get_my_company_id());

-- ==========================================
-- AUTH TRIGGER (Auto-profile creation)
-- ==========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, company_id)
  VALUES (
    NEW.id, 
    NEW.email, 
    'viewer', -- Default role
    (NEW.raw_user_meta_data->>'company_id')::UUID -- Expect company_id in metadata
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
