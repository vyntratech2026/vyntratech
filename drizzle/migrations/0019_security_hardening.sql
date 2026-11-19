-- Vyntra Agenda: security hardening
-- Preserve existing RPC signatures and trigger behavior.

-- 1. Ensure role checks always use the authenticated caller.
CREATE OR REPLACE FUNCTION public.has_role(
  _user_id uuid,
  _role public.app_role
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM public.company_members
       WHERE user_id = auth.uid()
         AND role = _role
     );
$$;

-- 2. Restrict tenant and professional helper functions.
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role)
  TO authenticated;

REVOKE ALL ON FUNCTION public.current_company_id()
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_company_id()
  TO authenticated;

REVOKE ALL ON FUNCTION public.is_company_admin(uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_company_admin(uuid)
  TO authenticated;

REVOKE ALL ON FUNCTION public.is_company_member(uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_company_member(uuid)
  TO authenticated;

REVOKE ALL ON FUNCTION public.current_barber_id()
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_barber_id()
  TO authenticated;

-- 3. Retire unused helper functions from direct execution.
REVOKE ALL ON FUNCTION public.is_staff()
  FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.admin_exists()
  FROM PUBLIC, anon, authenticated;

-- 4. Public booking RPCs: explicitly grant only intended roles.
REVOKE ALL ON FUNCTION public.slug_problem(text)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.slug_problem(text)
  TO anon, authenticated;

REVOKE ALL ON FUNCTION public.get_available_slots(uuid, date, uuid)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_available_slots(uuid, date, uuid)
  TO anon, authenticated;

REVOKE ALL ON FUNCTION public.create_booking(uuid, uuid, timestamptz, text, text)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_booking(uuid, uuid, timestamptz, text, text)
  TO anon, authenticated;

REVOKE ALL ON FUNCTION public.create_booking_with_products(uuid, uuid, timestamptz, text, text, jsonb)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_booking_with_products(uuid, uuid, timestamptz, text, text, jsonb)
  TO anon, authenticated;

REVOKE ALL ON FUNCTION public.get_booking(uuid)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_booking(uuid)
  TO anon, authenticated;

REVOKE ALL ON FUNCTION public.cancel_booking(uuid)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_booking(uuid)
  TO anon, authenticated;

REVOKE ALL ON FUNCTION public.submit_review(uuid, int, text)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_review(uuid, int, text)
  TO anon, authenticated;

-- 5. Admin RPCs: authenticated users only.
REVOKE ALL ON FUNCTION public.create_company(text, text, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_company(text, text, text)
  TO authenticated;

REVOKE ALL ON FUNCTION public.admin_create_booking(uuid, uuid, timestamptz, text, text, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_create_booking(uuid, uuid, timestamptz, text, text, text)
  TO authenticated;

REVOKE ALL ON FUNCTION public.update_appointment_status(uuid, public.appointment_status)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_appointment_status(uuid, public.appointment_status)
  TO authenticated;

-- 6. Trigger functions: no direct execution by application roles.
-- PostgreSQL continues to execute them through their registered triggers.
REVOKE ALL ON FUNCTION public.set_updated_at()
  FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.handle_new_user()
  FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.validate_offer_price()
  FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.apply_booking_promotion()
  FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.enforce_appointment_subscription()
  FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.enforce_professional_plan_capacity()
  FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.initialize_company_subscription()
  FROM PUBLIC, anon, authenticated;

-- 7. Internal price helper remains service-role only.
REVOKE ALL ON FUNCTION public.effective_service_price(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.effective_service_price(uuid)
  TO service_role;
