CREATE OR REPLACE FUNCTION public.enforce_professional_plan_capacity() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_plan text; v_limit integer; v_count integer;
BEGIN
 IF TG_OP = 'UPDATE' THEN
  IF NEW.company_id IS NOT DISTINCT FROM OLD.company_id THEN RETURN NEW; END IF;
 END IF;
 SELECT plan INTO v_plan FROM public.company_subscriptions WHERE company_id = NEW.company_id FOR UPDATE;
 v_limit := CASE v_plan WHEN 'start' THEN 3 WHEN 'pro' THEN 6 ELSE NULL END;
 IF v_limit IS NULL THEN RETURN NEW; END IF;
 SELECT count(*) INTO v_count FROM public.barbers WHERE company_id = NEW.company_id;
 IF v_count >= v_limit THEN
  RAISE EXCEPTION 'Limite de profissionais do plano atingido. Solicite um plano superior.' USING ERRCODE = 'P0001', DETAIL = 'PROFESSIONAL_PLAN_LIMIT';
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.enforce_professional_plan_capacity() FROM PUBLIC;
CREATE TRIGGER enforce_professional_plan_capacity BEFORE INSERT OR UPDATE OF company_id ON public.barbers FOR EACH ROW EXECUTE FUNCTION public.enforce_professional_plan_capacity();
COMMENT ON FUNCTION public.enforce_professional_plan_capacity() IS 'Serializes capacity checks on the subscription row; counts all registered professionals, including inactive. Legacy manual plans preserve existing capacity; existing professionals remain editable.';