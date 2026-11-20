CREATE OR REPLACE FUNCTION public.grant_company_trial(p_company_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_start timestamptz := now(); v_end timestamptz;
BEGIN
 IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'Acesso exclusivo do administrador da plataforma.' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM public.company_subscriptions WHERE company_id=p_company_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Empresa não encontrada.'; END IF;
 v_end := ((v_start AT TIME ZONE 'America/Maceio') + interval '7 days') AT TIME ZONE 'America/Maceio';
 UPDATE public.company_subscriptions SET status='active',plan='start',starts_at=v_start,expires_at=v_end,trial_ends_at=v_end,updated_at=now(),updated_by=auth.uid() WHERE company_id=p_company_id;
 INSERT INTO public.subscription_events(company_id,action,plan,starts_at,expires_at,actor_id) VALUES(p_company_id,'trial_started','start',v_start,v_end,auth.uid());
END $$;
REVOKE ALL ON FUNCTION public.grant_company_trial(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.grant_company_trial(uuid) TO authenticated;