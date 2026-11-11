alter table public.settings add column google_review_url text;
alter table public.settings add constraint settings_google_review_url_check check (google_review_url is null or (length(google_review_url) <= 2048 and google_review_url ~ '^https://(g[.]page|maps[.]app[.]goo[.]gl|([a-zA-Z0-9-]+[.])*google[.]com([.]br)?)(/|[?]|#|$)'));
grant select (google_review_url) on public.settings to anon;
comment on column public.settings.google_review_url is 'Optional Google review destination per company; site reviews remain separate.';
create or replace function public.get_booking(p_token uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare r record; s settings; v_slug text;
begin
  select a.*, b.name as barber_name, c.full_name as customer_name,
    exists (select 1 from reviews rv where rv.appointment_id = a.id) as has_review
  into r
  from appointments a join barbers b on b.id = a.barber_id join customers c on c.id = a.customer_id
  where a.manage_token = p_token;
  if not found then return null; end if;
  select * into s from settings where company_id = r.company_id;
  select slug into v_slug from companies where id = r.company_id;
  return jsonb_build_object(
    'service_name', r.service_name, 'barber_name', r.barber_name, 'customer_name', r.customer_name,
    'start_at', r.start_at, 'end_at', r.end_at, 'duration_minutes', r.duration_minutes, 'price', r.price,
    'status', r.status, 'has_review', r.has_review, 'cancellation_min_hours', s.cancellation_min_hours,
    'can_cancel', r.status in ('pending', 'confirmed') and r.start_at - now() >= make_interval(hours => s.cancellation_min_hours),
    'can_review', r.status = 'completed' and not r.has_review,
    'company_slug', v_slug, 'business_name', s.business_name, 'whatsapp', s.whatsapp,
    'logo_url', s.logo_url, 'brand_primary', s.brand_primary, 'brand_background', s.brand_background, 'brand_text', s.brand_text,
    'google_review_url', s.google_review_url
  );
end; $$;