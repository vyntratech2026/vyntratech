ALTER TABLE public.barbers ADD COLUMN deleted_at timestamptz;
COMMENT ON COLUMN public.barbers.deleted_at IS 'Removed professionals remain for appointment and financial history, but no longer occupy subscription capacity.';
CREATE OR REPLACE FUNCTION public.remove_professional(p_barber_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_barber public.barbers;
BEGIN
 SELECT * INTO v_barber FROM public.barbers WHERE id=p_barber_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Profissional não encontrado.'; END IF;
 IF NOT public.is_company_admin(v_barber.company_id) THEN RAISE EXCEPTION 'Apenas o administrador da empresa pode remover profissionais.' USING ERRCODE='42501'; END IF;
 IF v_barber.deleted_at IS NOT NULL THEN RETURN; END IF;
 IF EXISTS(SELECT 1 FROM public.appointments WHERE barber_id=p_barber_id AND status IN ('pending','confirmed') AND end_at>now()) THEN RAISE EXCEPTION 'Este profissional tem agendamentos pendentes. Cancele ou resolva esses agendamentos antes de removê-lo.'; END IF;
 UPDATE public.barbers SET deleted_at=now(),is_active=false,user_id=NULL WHERE id=p_barber_id;
 IF v_barber.user_id IS NOT NULL THEN
  DELETE FROM public.company_members WHERE company_id=v_barber.company_id AND user_id=v_barber.user_id AND role='barber';
  UPDATE public.profiles SET barber_id=NULL WHERE id=v_barber.user_id AND barber_id=p_barber_id;
 END IF;
END $$;
REVOKE ALL ON FUNCTION public.remove_professional(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.remove_professional(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.enforce_professional_plan_capacity() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_plan text; v_limit integer; v_count integer;
BEGIN
 IF NEW.deleted_at IS NOT NULL THEN NEW.is_active := false; RETURN NEW; END IF;
 IF TG_OP='UPDATE' THEN
  IF NEW.company_id IS NOT DISTINCT FROM OLD.company_id AND OLD.deleted_at IS NULL THEN RETURN NEW; END IF;
 END IF;
 SELECT plan INTO v_plan FROM public.company_subscriptions WHERE company_id=NEW.company_id FOR UPDATE;
 v_limit := CASE v_plan WHEN 'start' THEN 3 WHEN 'pro' THEN 6 ELSE NULL END;
 IF v_limit IS NULL THEN RETURN NEW; END IF;
 SELECT count(*) INTO v_count FROM public.barbers WHERE company_id=NEW.company_id AND deleted_at IS NULL AND id<>NEW.id;
 IF v_count>=v_limit THEN RAISE EXCEPTION 'Limite de profissionais do plano atingido. Solicite um plano superior.' USING ERRCODE='P0001',DETAIL='PROFESSIONAL_PLAN_LIMIT'; END IF;
 RETURN NEW;
END $$;
DROP TRIGGER enforce_professional_plan_capacity ON public.barbers;
CREATE TRIGGER enforce_professional_plan_capacity BEFORE INSERT OR UPDATE OF company_id,deleted_at,is_active ON public.barbers FOR EACH ROW EXECUTE FUNCTION public.enforce_professional_plan_capacity();
CREATE OR REPLACE FUNCTION public.set_company_subscription_dates(p_company_id uuid,p_plan text,p_start_date date,p_end_date date) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_start timestamptz; v_end timestamptz;
BEGIN
 IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'Acesso exclusivo do administrador da plataforma.' USING ERRCODE='42501'; END IF;
 IF p_plan IS NULL OR p_plan NOT IN ('start','pro','business') THEN RAISE EXCEPTION 'Plano inválido.' USING ERRCODE='22023'; END IF;
 IF p_start_date IS NULL OR p_end_date IS NULL OR p_end_date<p_start_date THEN RAISE EXCEPTION 'Informe início e vencimento válidos. O vencimento não pode ser anterior ao início.' USING ERRCODE='22023'; END IF;
 v_start := p_start_date::timestamp AT TIME ZONE 'America/Maceio';
 v_end := (p_end_date+1)::timestamp AT TIME ZONE 'America/Maceio';
 PERFORM 1 FROM public.company_subscriptions WHERE company_id=p_company_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Empresa não encontrada.'; END IF;
 UPDATE public.company_subscriptions SET status='active',plan=p_plan,starts_at=v_start,expires_at=v_end,updated_at=now(),updated_by=auth.uid() WHERE company_id=p_company_id;
 INSERT INTO public.subscription_events(company_id,action,plan,starts_at,expires_at,actor_id) VALUES(p_company_id,'activated',p_plan,v_start,v_end,auth.uid());
END $$;
REVOKE ALL ON FUNCTION public.set_company_subscription_dates(uuid,text,date,date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_company_subscription_dates(uuid,text,date,date) TO authenticated;
CREATE OR REPLACE FUNCTION public.company_access_active(p_company_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS(SELECT 1 FROM public.company_subscriptions WHERE company_id=p_company_id AND status='active' AND starts_at<=now() AND (plan='lifetime' OR expires_at>now())) $$;