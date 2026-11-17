ALTER TABLE public.company_subscriptions ADD COLUMN trial_ends_at timestamptz;
COMMENT ON COLUMN public.company_subscriptions.trial_ends_at IS 'Original free trial deadline; current access remains controlled by status, starts_at and expires_at. Never reset on renewal.';
CREATE OR REPLACE FUNCTION public.initialize_company_subscription() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_start timestamptz := now(); v_end timestamptz;
BEGIN
 v_end := ((v_start AT TIME ZONE 'America/Maceio') + interval '7 days') AT TIME ZONE 'America/Maceio';
 INSERT INTO public.company_subscriptions(company_id,status,plan,starts_at,expires_at,trial_ends_at)
 VALUES (NEW.id,'active','start',v_start,v_end,v_end);
 INSERT INTO public.subscription_events(company_id,action,plan,starts_at,expires_at,actor_id)
 VALUES (NEW.id,'trial_started','start',v_start,v_end,NEW.created_by);
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.initialize_company_subscription() FROM PUBLIC, anon, authenticated;