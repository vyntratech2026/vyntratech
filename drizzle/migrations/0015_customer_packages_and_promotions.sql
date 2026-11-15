CREATE TABLE public.customer_offers (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id), kind text NOT NULL CHECK(kind IN ('package','promotion')), name text NOT NULL CHECK(length(btrim(name))>=2), description text NOT NULL DEFAULT '', price numeric(12,2) NOT NULL CHECK(price>=0), period_months integer NOT NULL DEFAULT 1 CHECK(period_months IN (1,3,6,12)), benefits text NOT NULL DEFAULT '', service_id uuid, start_date date, end_date date, is_active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(service_id,company_id) REFERENCES public.services(id,company_id),
 CHECK((kind='package' AND service_id IS NULL) OR (kind='promotion' AND service_id IS NOT NULL AND start_date IS NOT NULL AND end_date IS NOT NULL AND end_date>=start_date))
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.customer_offers TO authenticated;
GRANT ALL ON public.customer_offers TO service_role;
GRANT SELECT(id,company_id,kind,name,description,price,period_months,benefits,service_id,start_date,end_date,is_active) ON public.customer_offers TO anon;
ALTER TABLE public.customer_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company admin manages offers" ON public.customer_offers FOR ALL TO authenticated USING(public.is_company_admin(company_id)) WITH CHECK(public.is_company_admin(company_id));
CREATE POLICY "Visitors read published offers" ON public.customer_offers FOR SELECT TO anon,authenticated USING(is_active AND public.company_access_active(company_id) AND (kind='package' OR (start_date<=(now() AT TIME ZONE 'America/Maceio')::date AND end_date>=(now() AT TIME ZONE 'America/Maceio')::date)));
CREATE POLICY "Subscription required" ON public.customer_offers AS RESTRICTIVE FOR ALL TO anon,authenticated USING(public.company_access_active(company_id)) WITH CHECK(public.company_access_active(company_id));
CREATE OR REPLACE FUNCTION public.validate_offer_price() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_price numeric;
BEGIN
 IF NEW.kind='promotion' THEN
 SELECT price INTO v_price FROM public.services WHERE id=NEW.service_id AND company_id=NEW.company_id;
 IF NOT FOUND OR NEW.price>=v_price THEN RAISE EXCEPTION 'O preço promocional deve ser menor que o preço normal do serviço.'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER validate_offer_price BEFORE INSERT OR UPDATE ON public.customer_offers FOR EACH ROW EXECUTE FUNCTION public.validate_offer_price();
CREATE OR REPLACE FUNCTION public.effective_service_price(p_service uuid) RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
SELECT least(s.price,coalesce((SELECT min(o.price) FROM public.customer_offers o WHERE o.company_id=s.company_id AND o.service_id=s.id AND o.kind='promotion' AND o.is_active AND o.start_date<=(now() AT TIME ZONE 'America/Maceio')::date AND o.end_date>=(now() AT TIME ZONE 'America/Maceio')::date),s.price)) FROM public.services s WHERE s.id=p_service
$$;
REVOKE ALL ON FUNCTION public.effective_service_price(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.effective_service_price(uuid) TO service_role;
CREATE OR REPLACE FUNCTION public.apply_booking_promotion() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 NEW.price := public.effective_service_price(NEW.service_id);
 RETURN NEW;
END $$;
CREATE TRIGGER apply_booking_promotion BEFORE INSERT ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.apply_booking_promotion();
COMMENT ON TABLE public.customer_offers IS 'Customer subscription package catalogue contracted manually by WhatsApp (no automatic billing or entitlement redemption); dated promotions apply at booking creation and preserve appointment price snapshots.';