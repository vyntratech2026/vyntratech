alter table public.appointments add column product_items jsonb not null default '[]'::jsonb;
comment on column public.appointments.product_items is 'Product requests with name, quantity and unit price snapshots; not payments and never part of service commission.';
create or replace function public.create_booking_with_products(p_service_id uuid, p_barber_id uuid, p_start_at timestamptz, p_full_name text, p_phone text, p_products jsonb default '[]'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_company uuid; v_items jsonb := '[]'::jsonb; v_item jsonb; v_product products; v_quantity integer; v_result jsonb;
begin
 select company_id into v_company from services where id=p_service_id and is_active;
 if v_company is null then raise exception 'Serviço indisponível.'; end if;
 if p_products is null or jsonb_typeof(p_products) <> 'array' then raise exception 'Produtos inválidos.'; end if;
 for v_item in select value from jsonb_array_elements(p_products) loop
  if coalesce(v_item->>'quantity','') !~ '^[1-9][0-9]?$' then raise exception 'Quantidade de produto inválida.'; end if;
  v_quantity := (v_item->>'quantity')::integer;
  select * into v_product from products where id=(v_item->>'product_id')::uuid and company_id=v_company and is_available for share;
  if not found then raise exception 'Um produto não está mais disponível. Revise os produtos.'; end if;
  if exists(select 1 from jsonb_array_elements(v_items) i where i->>'product_id'=v_product.id::text) then raise exception 'Produto repetido.'; end if;
  v_items := v_items || jsonb_build_array(jsonb_build_object('product_id',v_product.id,'name',v_product.name,'quantity',v_quantity,'unit_price',v_product.price));
 end loop;
 v_result := public.create_booking(p_service_id,p_barber_id,p_start_at,p_full_name,p_phone);
 update appointments set product_items=v_items where id=(v_result->>'id')::uuid and company_id=v_company;
 return v_result || jsonb_build_object('product_items',v_items);
end; $$;
revoke execute on function public.create_booking_with_products(uuid,uuid,timestamptz,text,text,jsonb) from public;
grant execute on function public.create_booking_with_products(uuid,uuid,timestamptz,text,text,jsonb) to anon, authenticated;
CREATE OR REPLACE FUNCTION public.get_booking(p_token uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
declare r record; s settings; v_slug text;
begin
  select a.*, b.name as barber_name, c.full_name as customer_name,
    exists (select 1 from reviews rv where rv.appointment_id = a.id) as has_review
  into r from appointments a join barbers b on b.id = a.barber_id join customers c on c.id = a.customer_id where a.manage_token = p_token;
  if not found then return null; end if;
  select * into s from settings where company_id = r.company_id;
  select slug into v_slug from companies where id = r.company_id;
  return jsonb_build_object(
    'service_name', r.service_name, 'barber_name', r.barber_name, 'customer_name', r.customer_name,
    'start_at', r.start_at, 'end_at', r.end_at, 'duration_minutes', r.duration_minutes, 'price', r.price,
    'product_items',r.product_items,
    'status', r.status, 'has_review', r.has_review, 'cancellation_min_hours', s.cancellation_min_hours,
    'can_cancel', r.status in ('pending', 'confirmed') and r.start_at - now() >= make_interval(hours => s.cancellation_min_hours),
    'can_review', r.status = 'completed' and not r.has_review,
    'company_slug', v_slug, 'business_name', s.business_name, 'whatsapp', s.whatsapp,
    'logo_url', s.logo_url, 'brand_primary', s.brand_primary, 'brand_background', s.brand_background, 'brand_text', s.brand_text,
    'google_review_url', s.google_review_url);
end; $$;