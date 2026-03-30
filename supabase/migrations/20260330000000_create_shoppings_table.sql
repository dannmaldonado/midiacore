-- Migration: Create shoppings table (data normalization)
-- Date: 2026-03-30
-- Problem: Frontend queries 'shoppings' table which does not exist
-- Solution: Create normalized shoppings table, backfill from existing data, add FKs

-- ==========================================
-- 1. CREATE TABLE public.shoppings
-- ==========================================

CREATE TABLE IF NOT EXISTS public.shoppings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    location TEXT,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id, name)
);

-- Enable RLS
ALTER TABLE public.shoppings ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 2. RLS POLICY
-- ==========================================

CREATE POLICY "Company dynamic access for shoppings"
ON public.shoppings FOR ALL
USING (company_id = public.get_my_company_id())
WITH CHECK (company_id = public.get_my_company_id());

-- ==========================================
-- 3. INDEXES
-- ==========================================

CREATE INDEX idx_shoppings_company_id ON public.shoppings(company_id);
CREATE INDEX idx_shoppings_name ON public.shoppings(name);

-- ==========================================
-- 4. BACKFILL FROM EXISTING DATA
-- ==========================================

-- Extract unique shopping names from contracts
INSERT INTO public.shoppings (company_id, name)
SELECT DISTINCT company_id, shopping_name
FROM public.contracts
WHERE shopping_name IS NOT NULL
  AND shopping_name != ''
ON CONFLICT (company_id, name) DO NOTHING;

-- Extract unique shopping names from opportunities
INSERT INTO public.shoppings (company_id, name)
SELECT DISTINCT company_id, shopping_name
FROM public.opportunities
WHERE shopping_name IS NOT NULL
  AND shopping_name != ''
ON CONFLICT (company_id, name) DO NOTHING;

-- ==========================================
-- 5. ADD shopping_id FOREIGN KEYS
-- ==========================================

ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS shopping_id UUID REFERENCES public.shoppings(id) ON DELETE SET NULL;

ALTER TABLE public.opportunities
ADD COLUMN IF NOT EXISTS shopping_id UUID REFERENCES public.shoppings(id) ON DELETE SET NULL;

-- ==========================================
-- 6. POPULATE shopping_id FROM shopping_name
-- ==========================================

UPDATE public.contracts c
SET shopping_id = (
    SELECT s.id FROM public.shoppings s
    WHERE s.company_id = c.company_id
      AND s.name = c.shopping_name
    LIMIT 1
)
WHERE c.shopping_name IS NOT NULL
  AND c.shopping_id IS NULL;

UPDATE public.opportunities o
SET shopping_id = (
    SELECT s.id FROM public.shoppings s
    WHERE s.company_id = o.company_id
      AND s.name = o.shopping_name
    LIMIT 1
)
WHERE o.shopping_name IS NOT NULL
  AND o.shopping_id IS NULL;
