ALTER TABLE public.company_subscriptions DROP CONSTRAINT company_subscriptions_plan_check;
ALTER TABLE public.company_subscriptions ADD CONSTRAINT company_subscriptions_plan_check CHECK (plan IN ('start','pro','business','monthly','quarterly','semiannual','annual','lifetime'));
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
 v_months := CASE p_plan WHEN 'start' THEN 1 WHEN 'pro' THEN 1 WHEN 'business' THEN 1 WHEN 'monthly' THEN 1 WHEN 'quarterly' THEN 3 WHEN 'semiannual' THEN 6 WHEN 'annual' THEN 12 WHEN 'lifetime' THEN 0 ELSE NULL END;
 IF v_months IS NULL THEN RAISE EXCEPTION 'Plano inválido.' USING errcode='22023'; END IF;
 SELECT greatest(now(),expires_at) INTO v_start FROM public.company_subscriptions WHERE company_id=p_company_id AND status='active' AND expires_at > now();
 v_start := coalesce(v_start,now());
 IF v_months > 0 THEN v_end := ((v_start AT TIME ZONE 'America/Maceio') + make_interval(months=>v_months)) AT TIME ZONE 'America/Maceio'; END IF;
 UPDATE public.company_subscriptions SET status='active',plan=p_plan,starts_at=now(),expires_at=v_end,updated_at=now(),updated_by=auth.uid() WHERE company_id=p_company_id;
 INSERT INTO public.subscription_events(company_id,action,plan,starts_at,expires_at,actor_id) VALUES(p_company_id,'activated',p_plan,now(),v_end,auth.uid());
END $$;