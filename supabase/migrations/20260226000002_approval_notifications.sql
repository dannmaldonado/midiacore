-- Story 3.2: Approval Workflow Notifications
-- Create notifications table and RPC function for approval notifications

-- ==========================================
-- NOTIFICATIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('approval_assigned', 'approval_deadline', 'approval_completed')),
  contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  step text,
  payload jsonb DEFAULT '{}',
  read_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT unique_approval_notification UNIQUE (user_id, contract_id, step, type)
);

-- Create index for faster queries
CREATE INDEX idx_notifications_user_company ON public.notifications(user_id, company_id);
CREATE INDEX idx_notifications_contract ON public.notifications(contract_id);
CREATE INDEX idx_notifications_read ON public.notifications(read_at);

-- ==========================================
-- RLS POLICIES FOR NOTIFICATIONS
-- ==========================================

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can read their own notifications
CREATE POLICY "notifications_select_own"
ON public.notifications FOR SELECT
USING (
  user_id = auth.uid()
  AND company_id = public.get_my_company_id()
);

-- INSERT: Only system (via RPC) can create notifications
CREATE POLICY "notifications_insert_system"
ON public.notifications FOR INSERT
WITH CHECK (
  company_id = public.get_my_company_id()
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- UPDATE: Users can mark their notifications as read
CREATE POLICY "notifications_update_own"
ON public.notifications FOR UPDATE
USING (
  user_id = auth.uid()
  AND company_id = public.get_my_company_id()
)
WITH CHECK (
  user_id = auth.uid()
  AND company_id = public.get_my_company_id()
);

-- ==========================================
-- RPC FUNCTION: Create approval notification
-- ==========================================

CREATE OR REPLACE FUNCTION public.create_approval_notification(
  p_contract_id uuid,
  p_user_id uuid,
  p_step text,
  p_deadline timestamp with time zone
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
  v_notification_id uuid;
BEGIN
  -- Get company_id from contract
  SELECT company_id INTO v_company_id
  FROM public.contracts
  WHERE id = p_contract_id;

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Contract not found';
  END IF;

  -- Insert or update notification
  INSERT INTO public.notifications (
    company_id,
    user_id,
    type,
    contract_id,
    step,
    payload,
    created_at
  )
  VALUES (
    v_company_id,
    p_user_id,
    'approval_assigned',
    p_contract_id,
    p_step,
    jsonb_build_object(
      'deadline', p_deadline,
      'step', p_step,
      'contract_id', p_contract_id
    ),
    now()
  )
  ON CONFLICT (user_id, contract_id, step, type)
  DO UPDATE SET
    payload = EXCLUDED.payload,
    created_at = now(),
    read_at = NULL
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;

-- ==========================================
-- HELPER FUNCTION: Calculate days until deadline
-- ==========================================

CREATE OR REPLACE FUNCTION public.days_until_deadline(p_deadline timestamp with time zone)
RETURNS integer
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXTRACT(DAY FROM (p_deadline - now()))::integer;
END;
$$;

-- ==========================================
-- HELPER FUNCTION: Get SLA days for step
-- ==========================================

CREATE OR REPLACE FUNCTION public.get_sla_days(p_step text)
RETURNS integer
LANGUAGE plpgsql
AS $$
BEGIN
  CASE p_step
    WHEN 'pre_approval' THEN RETURN 3;
    WHEN 'financial' THEN RETURN 5;
    WHEN 'director' THEN RETURN 7;
    WHEN 'legal' THEN RETURN 7;
    ELSE RETURN 0;
  END CASE;
END;
$$;

-- ==========================================
-- TRIGGER: Auto-create notification on assignment
-- ==========================================

CREATE OR REPLACE FUNCTION public.trigger_approval_assigned()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deadline timestamp with time zone;
  v_sla_days integer;
BEGIN
  -- Only create notification if assigned_to changed and is not null
  IF NEW.assigned_to IS NOT NULL AND (OLD.assigned_to IS NULL OR OLD.assigned_to != NEW.assigned_to) THEN
    -- Calculate deadline based on SLA
    v_sla_days := public.get_sla_days(NEW.current_step);
    v_deadline := now() + (v_sla_days || ' days')::interval;

    -- Create notification
    PERFORM public.create_approval_notification(
      NEW.contract_id,
      NEW.assigned_to,
      NEW.current_step,
      v_deadline
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS approval_assigned_notification ON public.approval_workflows;

-- Create trigger
CREATE TRIGGER approval_assigned_notification
AFTER INSERT OR UPDATE OF assigned_to ON public.approval_workflows
FOR EACH ROW
EXECUTE FUNCTION public.trigger_approval_assigned();
