-- Fix RLS: Enforce viewer READ-ONLY access
-- Story 2.3: Auth Security & Role Types
-- Viewers can only SELECT, not INSERT/UPDATE/DELETE

-- ==========================================
-- HELPER FUNCTION: Check if user can edit
-- ==========================================
CREATE OR REPLACE FUNCTION public.can_user_edit()
RETURNS BOOLEAN AS $$
  SELECT
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'editor')
    )
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ==========================================
-- CONTRACTS — Role-based policies
-- ==========================================

-- Drop old policy
DROP POLICY IF EXISTS "Company dynamic access for contracts" ON public.contracts;

-- SELECT: All users in company can read
CREATE POLICY "contracts_select_company_access"
ON public.contracts FOR SELECT
USING (company_id = public.get_my_company_id());

-- INSERT: Only admin/editor can create
CREATE POLICY "contracts_insert_editor_only"
ON public.contracts FOR INSERT
WITH CHECK (
  company_id = public.get_my_company_id()
  AND public.can_user_edit()
);

-- UPDATE: Only admin/editor can edit
CREATE POLICY "contracts_update_editor_only"
ON public.contracts FOR UPDATE
USING (company_id = public.get_my_company_id() AND public.can_user_edit())
WITH CHECK (company_id = public.get_my_company_id() AND public.can_user_edit());

-- DELETE: Only admin can delete
CREATE POLICY "contracts_delete_admin_only"
ON public.contracts FOR DELETE
USING (
  company_id = public.get_my_company_id()
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ==========================================
-- OPPORTUNITIES — Role-based policies
-- ==========================================

-- Drop old policy
DROP POLICY IF EXISTS "Company dynamic access for opportunities" ON public.opportunities;

-- SELECT: All users in company can read
CREATE POLICY "opportunities_select_company_access"
ON public.opportunities FOR SELECT
USING (company_id = public.get_my_company_id());

-- INSERT: Only admin/editor can create
CREATE POLICY "opportunities_insert_editor_only"
ON public.opportunities FOR INSERT
WITH CHECK (
  company_id = public.get_my_company_id()
  AND public.can_user_edit()
);

-- UPDATE: Only admin/editor can edit
CREATE POLICY "opportunities_update_editor_only"
ON public.opportunities FOR UPDATE
USING (company_id = public.get_my_company_id() AND public.can_user_edit())
WITH CHECK (company_id = public.get_my_company_id() AND public.can_user_edit());

-- DELETE: Only admin can delete
CREATE POLICY "opportunities_delete_admin_only"
ON public.opportunities FOR DELETE
USING (
  company_id = public.get_my_company_id()
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ==========================================
-- CONTACTS — Role-based policies
-- ==========================================

-- Drop old policy
DROP POLICY IF EXISTS "Company dynamic access for contacts" ON public.contacts;

-- SELECT: All users in company can read
CREATE POLICY "contacts_select_company_access"
ON public.contacts FOR SELECT
USING (company_id = public.get_my_company_id());

-- INSERT: Only admin/editor can create
CREATE POLICY "contacts_insert_editor_only"
ON public.contacts FOR INSERT
WITH CHECK (
  company_id = public.get_my_company_id()
  AND public.can_user_edit()
);

-- UPDATE: Only admin/editor can edit
CREATE POLICY "contacts_update_editor_only"
ON public.contacts FOR UPDATE
USING (company_id = public.get_my_company_id() AND public.can_user_edit())
WITH CHECK (company_id = public.get_my_company_id() AND public.can_user_edit());

-- DELETE: Only admin can delete
CREATE POLICY "contacts_delete_admin_only"
ON public.contacts FOR DELETE
USING (
  company_id = public.get_my_company_id()
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ==========================================
-- APPROVAL_WORKFLOWS — Role-based policies
-- ==========================================

-- Drop old policy if exists
DROP POLICY IF EXISTS "Company dynamic access for approval_workflows" ON public.approval_workflows;

-- SELECT: All users can read
CREATE POLICY "approval_workflows_select"
ON public.approval_workflows FOR SELECT
USING (
  contract_id IN (
    SELECT id FROM public.contracts
    WHERE company_id = public.get_my_company_id()
  )
);

-- INSERT/UPDATE: Only admin can manage workflows
CREATE POLICY "approval_workflows_write_admin_only"
ON public.approval_workflows FOR INSERT
WITH CHECK (
  contract_id IN (
    SELECT id FROM public.contracts
    WHERE company_id = public.get_my_company_id()
  )
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "approval_workflows_update_admin_only"
ON public.approval_workflows FOR UPDATE
USING (
  contract_id IN (
    SELECT id FROM public.contracts
    WHERE company_id = public.get_my_company_id()
  )
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  contract_id IN (
    SELECT id FROM public.contracts
    WHERE company_id = public.get_my_company_id()
  )
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

DELETE FROM public.approval_workflows WHERE assigned_to NOT IN (SELECT id FROM public.profiles);

CREATE POLICY "approval_workflows_delete_admin_only"
ON public.approval_workflows FOR DELETE
USING (
  contract_id IN (
    SELECT id FROM public.contracts
    WHERE company_id = public.get_my_company_id()
  )
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
