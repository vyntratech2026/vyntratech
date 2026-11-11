CREATE TABLE public.platform_admins (user_id uuid PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.platform_admins TO authenticated;
GRANT ALL ON public.platform_admins TO service_role;
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own platform role" ON public.platform_admins FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE TABLE public.platform_admin_authorizations (email text PRIMARY KEY);
GRANT ALL ON public.platform_admin_authorizations TO service_role;
ALTER TABLE public.platform_admin_authorizations ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.is_platform_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid()) $$;
REVOKE ALL ON FUNCTION public.is_platform_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated;
CREATE OR REPLACE FUNCTION public.claim_platform_admin() RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF auth.uid() IS NULL THEN RETURN false; END IF;
 IF EXISTS (SELECT 1 FROM auth.users u JOIN public.platform_admin_authorizations a ON a.email = lower(u.email) WHERE u.id = auth.uid() AND u.email_confirmed_at IS NOT NULL) THEN
   INSERT INTO public.platform_admins(user_id) VALUES (auth.uid()) ON CONFLICT DO NOTHING;
 END IF;
 RETURN public.is_platform_admin();
END $$;
REVOKE ALL ON FUNCTION public.claim_platform_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_platform_admin() TO authenticated;
CREATE TABLE public.company_subscriptions (
 company_id uuid PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
 status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','suspended')),
 plan text CHECK (plan IN ('monthly','quarterly','semiannual','annual','lifetime')),
 starts_at timestamptz,
 expires_at timestamptz,
 updated_at timestamptz NOT NULL DEFAULT now(),
 updated_by uuid,
 CHECK (status <> 'active' OR (plan IS NOT NULL AND starts_at IS NOT NULL AND ((plan = 'lifetime' AND expires_at IS NULL) OR (plan <> 'lifetime' AND expires_at IS NOT NULL))))
);
GRANT SELECT ON public.company_subscriptions TO authenticated;
GRANT ALL ON public.company_subscriptions TO service_role;
ALTER TABLE public.company_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner or platform reads subscription" ON public.company_subscriptions FOR SELECT TO authenticated USING (company_id = public.current_company_id() OR public.is_platform_admin());
CREATE TABLE public.subscription_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id), action text NOT NULL, plan text, starts_at timestamptz, expires_at timestamptz, actor_id uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subscription_events TO authenticated;
GRANT ALL ON public.subscription_events TO service_role;
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Platform reads subscription history" ON public.subscription_events FOR SELECT TO authenticated USING (public.is_platform_admin());
INSERT INTO public.company_subscriptions(company_id,status,plan,starts_at) SELECT id,'active','lifetime',now() FROM public.companies;
CREATE OR REPLACE FUNCTION public.initialize_company_subscription() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN INSERT INTO public.company_subscriptions(company_id) VALUES (NEW.id); RETURN NEW; END $$;
CREATE TRIGGER initialize_company_subscription AFTER INSERT ON public.companies FOR EACH ROW EXECUTE FUNCTION public.initialize_company_subscription();
CREATE OR REPLACE FUNCTION public.company_access_active(p_company_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT EXISTS (SELECT 1 FROM public.company_subscriptions WHERE company_id=p_company_id AND status='active' AND (plan='lifetime' OR expires_at > now())) $$;
REVOKE ALL ON FUNCTION public.company_access_active(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.company_access_active(uuid) TO anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION public.set_company_subscription(p_company_id uuid,p_plan text,p_suspend boolean DEFAULT false) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_start timestamptz := now(); v_end timestamptz; v_months integer;
BEGIN
 IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'Acesso exclusivo do administrador da plataforma.' USING errcode='42501'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.companies WHERE id=p_company_id) THEN RAISE EXCEPTION 'Empresa não encontrada.'; END IF;
 IF p_suspend THEN
  UPDATE public.company_subscriptions SET status='suspended',updated_at=now(),updated_by=auth.uid() WHERE company_id=p_company_id;
  INSERT INTO public.subscription_events(company_id,action,actor_id) VALUES (p_company_id,'suspended',auth.uid());
  RETURN;
 END IF;
 v_months := CASE p_plan WHEN 'monthly' THEN 1 WHEN 'quarterly' THEN 3 WHEN 'semiannual' THEN 6 WHEN 'annual' THEN 12 WHEN 'lifetime' THEN 0 ELSE NULL END;
 IF v_months IS NULL THEN RAISE EXCEPTION 'Prazo inválido.' USING errcode='22023'; END IF;
 SELECT greatest(now(),expires_at) INTO v_start FROM public.company_subscriptions WHERE company_id=p_company_id AND status='active' AND expires_at > now();
 v_start := coalesce(v_start,now());
 IF v_months > 0 THEN v_end := ((v_start AT TIME ZONE 'America/Maceio') + make_interval(months=>v_months)) AT TIME ZONE 'America/Maceio'; END IF;
 UPDATE public.company_subscriptions SET status='active',plan=p_plan,starts_at=now(),expires_at=v_end,updated_at=now(),updated_by=auth.uid() WHERE company_id=p_company_id;
 INSERT INTO public.subscription_events(company_id,action,plan,starts_at,expires_at,actor_id) VALUES(p_company_id,'activated',p_plan,now(),v_end,auth.uid());
END $$;
REVOKE ALL ON FUNCTION public.set_company_subscription(uuid,text,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_company_subscription(uuid,text,boolean) TO authenticated;
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['appointments','barbers','barber_services','blocked_times','customers','notification_settings','payments','products','reviews','services','site_videos','working_hours'] LOOP
 EXECUTE format('CREATE POLICY "Subscription required" ON public.%I AS RESTRICTIVE FOR ALL TO anon,authenticated USING (public.company_access_active(company_id)) WITH CHECK (public.company_access_active(company_id))',t);
 END LOOP;
END $$;
CREATE POLICY "Subscription required for settings updates" ON public.settings AS RESTRICTIVE FOR UPDATE TO authenticated USING (public.company_access_active(company_id)) WITH CHECK (public.company_access_active(company_id));
CREATE OR REPLACE FUNCTION public.enforce_appointment_subscription() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 IF (TG_OP='INSERT' OR NEW.start_at IS DISTINCT FROM OLD.start_at OR NEW.barber_id IS DISTINCT FROM OLD.barber_id) AND NOT public.company_access_active(NEW.company_id) THEN RAISE EXCEPTION 'Agendamentos indisponíveis: acesso da empresa não liberado ou vencido.' USING errcode='42501'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER enforce_appointment_subscription BEFORE INSERT OR UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.enforce_appointment_subscription();
DO $$ DECLARE def text; BEGIN
 SELECT pg_get_functiondef('public.get_available_slots(uuid,date,uuid)'::regprocedure) INTO def;
 def := replace(def,'if v_dur is null then return; end if;', 'if v_dur is null or not public.company_access_active(v_cid) then return; end if;');
 EXECUTE def;
END $$;