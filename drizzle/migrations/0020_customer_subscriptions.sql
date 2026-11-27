ALTER TABLE public.customer_offers
  ADD CONSTRAINT customer_offers_id_company_key UNIQUE (id, company_id);

ALTER TABLE public.customers
  ADD COLUMN is_subscriber boolean NOT NULL DEFAULT false,
  ADD COLUMN subscription_offer_id uuid,
  ADD COLUMN subscription_package_name text,
  ADD COLUMN subscription_months integer,
  ADD COLUMN subscription_started_at date,
  ADD COLUMN subscription_ends_at date;

ALTER TABLE public.customers
  ADD CONSTRAINT customers_subscription_offer_company_fkey
    FOREIGN KEY (subscription_offer_id, company_id)
    REFERENCES public.customer_offers (id, company_id)
    ON DELETE SET NULL (subscription_offer_id),
  ADD CONSTRAINT customers_subscription_months_check
    CHECK (subscription_months IS NULL OR subscription_months BETWEEN 1 AND 120),
  ADD CONSTRAINT customers_subscription_dates_check
    CHECK (subscription_started_at IS NULL OR subscription_ends_at IS NULL OR subscription_ends_at >= subscription_started_at),
  ADD CONSTRAINT customers_subscription_state_check
    CHECK (
      (NOT is_subscriber AND subscription_offer_id IS NULL AND subscription_package_name IS NULL AND subscription_months IS NULL AND subscription_started_at IS NULL AND subscription_ends_at IS NULL)
      OR
      (is_subscriber AND subscription_months IS NOT NULL AND (subscription_offer_id IS NOT NULL OR nullif(btrim(coalesce(subscription_package_name, '')), '') IS NOT NULL))
    );

CREATE OR REPLACE FUNCTION public.validate_customer_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offer_name text;
BEGIN
  IF NOT NEW.is_subscriber THEN
    NEW.subscription_offer_id := NULL;
    NEW.subscription_package_name := NULL;
    NEW.subscription_months := NULL;
    NEW.subscription_started_at := NULL;
    NEW.subscription_ends_at := NULL;
    RETURN NEW;
  END IF;

  IF NEW.subscription_months IS NULL OR NEW.subscription_months < 1 OR NEW.subscription_months > 120 THEN
    RAISE EXCEPTION 'Informe uma quantidade válida de meses (entre 1 e 120).' USING errcode = '22023';
  END IF;

  IF NEW.subscription_offer_id IS NOT NULL THEN
    SELECT name INTO v_offer_name
    FROM public.customer_offers
    WHERE id = NEW.subscription_offer_id
      AND company_id = NEW.company_id
      AND kind = 'package';

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Escolha um pacote de assinatura válido da empresa.' USING errcode = '22023';
    END IF;

    NEW.subscription_package_name := v_offer_name;
  ELSIF nullif(btrim(coalesce(NEW.subscription_package_name, '')), '') IS NULL THEN
    RAISE EXCEPTION 'Escolha um pacote de assinatura para o cliente.' USING errcode = '22023';
  END IF;

  IF NEW.subscription_started_at IS NULL THEN
    NEW.subscription_started_at := (now() AT TIME ZONE 'America/Maceio')::date;
  END IF;

  IF TG_OP = 'INSERT'
     OR NEW.is_subscriber IS DISTINCT FROM OLD.is_subscriber
     OR NEW.subscription_months IS DISTINCT FROM OLD.subscription_months
     OR NEW.subscription_started_at IS DISTINCT FROM OLD.subscription_started_at
     OR NEW.subscription_ends_at IS NULL THEN
    NEW.subscription_ends_at := (NEW.subscription_started_at + make_interval(months => NEW.subscription_months))::date;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_customer_subscription
BEFORE INSERT OR UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.validate_customer_subscription();

COMMENT ON COLUMN public.customers.is_subscriber IS 'Marks whether the customer holds a manually managed subscription package from the company catalogue.';