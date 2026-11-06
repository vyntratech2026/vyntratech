-- ===== Multi-company platform: companies + membership =====
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]([a-z0-9-]{1,46}[a-z0-9])$' and slug !~ '--'),
  name text not null check (length(btrim(name)) between 2 and 120),
  business_type text not null default 'outro',
  created_by uuid,
  created_at timestamptz not null default now()
);
grant select (id, slug, name, business_type, created_at) on public.companies to anon;
grant select on public.companies to authenticated;
grant all on public.companies to service_role;
alter table public.companies enable row level security;
create policy "Public read companies" on public.companies for select to anon, authenticated using (true);

create table public.company_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null unique,
  role public.app_role not null,
  created_at timestamptz not null default now()
);
create index company_members_company_idx on public.company_members (company_id);
grant select on public.company_members to authenticated;
grant all on public.company_members to service_role;
alter table public.company_members enable row level security;

create or replace function public.current_company_id()
returns uuid language sql stable security definer set search_path = public as $$
  select company_id from public.company_members where user_id = auth.uid() limit 1
$$;

create or replace function public.is_company_admin(_cid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.company_members where user_id = auth.uid() and company_id = _cid and role = 'admin')
$$;

create or replace function public.is_company_member(_cid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.company_members where user_id = auth.uid() and company_id = _cid)
$$;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.company_members where user_id = _user_id and role = _role)
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.company_members where user_id = auth.uid())
$$;

create policy "Own membership or company admin" on public.company_members for select to authenticated
  using (user_id = auth.uid() or public.is_company_admin(company_id));

-- First company: the existing business keeps all of its data.
insert into public.companies (id, slug, name, business_type)
select 'a62dbf4c-26dd-4a83-86b5-7d2bcb01a4ee', 'studio-cleison-cortes',
  coalesce(nullif(btrim((select business_name from public.settings limit 1)), ''), 'Studio Cleison Cortes'), 'barbearia';

insert into public.company_members (company_id, user_id, role)
select distinct on (user_id) 'a62dbf4c-26dd-4a83-86b5-7d2bcb01a4ee'::uuid, user_id, role
from public.user_roles order by user_id, (role = 'admin') desc;

comment on table public.user_roles is 'DEPRECATED: replaced by company_members';
drop policy "Own roles or admin" on public.user_roles;
create policy "Own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

-- ===== company_id on every business table =====
alter table public.settings add column company_id uuid references public.companies(id) on delete cascade;
alter table public.barbers add column company_id uuid references public.companies(id) on delete cascade;
alter table public.services add column company_id uuid references public.companies(id) on delete cascade;
alter table public.barber_services add column company_id uuid references public.companies(id) on delete cascade;
alter table public.working_hours add column company_id uuid references public.companies(id) on delete cascade;
alter table public.blocked_times add column company_id uuid references public.companies(id) on delete cascade;
alter table public.customers add column company_id uuid references public.companies(id) on delete cascade;
alter table public.appointments add column company_id uuid references public.companies(id) on delete cascade;
alter table public.payments add column company_id uuid references public.companies(id) on delete cascade;
alter table public.products add column company_id uuid references public.companies(id) on delete cascade;
alter table public.reviews add column company_id uuid references public.companies(id) on delete cascade;
alter table public.site_videos add column company_id uuid references public.companies(id) on delete cascade;
alter table public.notification_settings add column company_id uuid references public.companies(id) on delete cascade;

update public.settings set company_id = 'a62dbf4c-26dd-4a83-86b5-7d2bcb01a4ee' where company_id is null;
update public.barbers set company_id = 'a62dbf4c-26dd-4a83-86b5-7d2bcb01a4ee' where company_id is null;
update public.services set company_id = 'a62dbf4c-26dd-4a83-86b5-7d2bcb01a4ee' where company_id is null;
update public.barber_services set company_id = 'a62dbf4c-26dd-4a83-86b5-7d2bcb01a4ee' where company_id is null;
update public.working_hours set company_id = 'a62dbf4c-26dd-4a83-86b5-7d2bcb01a4ee' where company_id is null;
update public.blocked_times set company_id = 'a62dbf4c-26dd-4a83-86b5-7d2bcb01a4ee' where company_id is null;
update public.customers set company_id = 'a62dbf4c-26dd-4a83-86b5-7d2bcb01a4ee' where company_id is null;
update public.appointments set company_id = 'a62dbf4c-26dd-4a83-86b5-7d2bcb01a4ee' where company_id is null;
update public.payments set company_id = 'a62dbf4c-26dd-4a83-86b5-7d2bcb01a4ee' where company_id is null;
update public.products set company_id = 'a62dbf4c-26dd-4a83-86b5-7d2bcb01a4ee' where company_id is null;
update public.reviews set company_id = 'a62dbf4c-26dd-4a83-86b5-7d2bcb01a4ee' where company_id is null;
update public.site_videos set company_id = 'a62dbf4c-26dd-4a83-86b5-7d2bcb01a4ee' where company_id is null;
update public.notification_settings set company_id = 'a62dbf4c-26dd-4a83-86b5-7d2bcb01a4ee' where company_id is null;

alter table public.settings alter column company_id set not null;
alter table public.barbers alter column company_id set not null, alter column company_id set default public.current_company_id();
alter table public.services alter column company_id set not null, alter column company_id set default public.current_company_id();
alter table public.barber_services alter column company_id set not null, alter column company_id set default public.current_company_id();
alter table public.working_hours alter column company_id set not null, alter column company_id set default public.current_company_id();
alter table public.blocked_times alter column company_id set not null, alter column company_id set default public.current_company_id();
alter table public.customers alter column company_id set not null, alter column company_id set default public.current_company_id();
alter table public.appointments alter column company_id set not null, alter column company_id set default public.current_company_id();
alter table public.payments alter column company_id set not null, alter column company_id set default public.current_company_id();
alter table public.products alter column company_id set not null, alter column company_id set default public.current_company_id();
alter table public.reviews alter column company_id set not null;
alter table public.site_videos alter column company_id set not null, alter column company_id set default public.current_company_id();
alter table public.notification_settings alter column company_id set not null, alter column company_id set default public.current_company_id();

-- settings / notification_settings: one row per company instead of a single row
alter table public.settings drop constraint settings_pkey;
alter table public.settings drop constraint settings_id_check;
alter table public.settings add constraint settings_company_pkey primary key (company_id);
alter table public.settings alter column business_name set default '';
comment on column public.settings.id is 'DEPRECATED: settings are keyed by company_id';

alter table public.notification_settings drop constraint notification_settings_pkey;
alter table public.notification_settings drop constraint notification_settings_id_check;
alter table public.notification_settings add constraint notification_settings_company_pkey primary key (company_id);
comment on column public.notification_settings.id is 'DEPRECATED: keyed by company_id';

-- customers are unique per company, not globally
alter table public.customers drop constraint customers_phone_key;
alter table public.customers add constraint customers_company_phone_key unique (company_id, phone);

create index barbers_company_idx on public.barbers (company_id);
create index services_company_idx on public.services (company_id);
create index barber_services_company_idx on public.barber_services (company_id);
create index working_hours_company_idx on public.working_hours (company_id);
create index blocked_times_company_idx on public.blocked_times (company_id);
create index appointments_company_start_idx on public.appointments (company_id, start_at);
create index payments_company_date_idx on public.payments (company_id, payment_date);
create index products_company_idx on public.products (company_id);
create index reviews_company_idx on public.reviews (company_id);
create index site_videos_company_idx on public.site_videos (company_id);

-- Cross-company links are impossible: every reference must stay inside the same company.
alter table public.barbers add constraint barbers_id_company_key unique (id, company_id);
alter table public.services add constraint services_id_company_key unique (id, company_id);
alter table public.customers add constraint customers_id_company_key unique (id, company_id);
alter table public.appointments add constraint appointments_id_company_key unique (id, company_id);
alter table public.products add constraint products_id_company_key unique (id, company_id);

alter table public.barber_services
  add constraint barber_services_barber_company_fkey foreign key (barber_id, company_id) references public.barbers (id, company_id) on delete cascade,
  add constraint barber_services_service_company_fkey foreign key (service_id, company_id) references public.services (id, company_id) on delete cascade;
alter table public.working_hours
  add constraint working_hours_barber_company_fkey foreign key (barber_id, company_id) references public.barbers (id, company_id) on delete cascade;
alter table public.blocked_times
  add constraint blocked_times_barber_company_fkey foreign key (barber_id, company_id) references public.barbers (id, company_id) on delete cascade;
alter table public.appointments
  add constraint appointments_customer_company_fkey foreign key (customer_id, company_id) references public.customers (id, company_id),
  add constraint appointments_barber_company_fkey foreign key (barber_id, company_id) references public.barbers (id, company_id),
  add constraint appointments_service_company_fkey foreign key (service_id, company_id) references public.services (id, company_id);
alter table public.payments
  add constraint payments_appointment_company_fkey foreign key (appointment_id, company_id) references public.appointments (id, company_id),
  add constraint payments_customer_company_fkey foreign key (customer_id, company_id) references public.customers (id, company_id) on delete set null (customer_id),
  add constraint payments_barber_company_fkey foreign key (barber_id, company_id) references public.barbers (id, company_id) on delete set null (barber_id),
  add constraint payments_product_company_fkey foreign key (product_id, company_id) references public.products (id, company_id) on delete set null (product_id);
alter table public.reviews
  add constraint reviews_appointment_company_fkey foreign key (appointment_id, company_id) references public.appointments (id, company_id) on delete cascade,
  add constraint reviews_customer_company_fkey foreign key (customer_id, company_id) references public.customers (id, company_id) on delete cascade,
  add constraint reviews_barber_company_fkey foreign key (barber_id, company_id) references public.barbers (id, company_id) on delete set null (barber_id);

-- public column grants now include the company column
grant select (company_id) on public.settings to anon;
grant select (company_id) on public.barbers to anon;
grant select (company_id) on public.reviews to anon;
grant select (company_id) on public.site_videos to anon;
grant insert on public.settings to service_role;

-- ===== Policies: everything scoped to the company =====
drop policy "Public read settings" on public.settings;
drop policy "Admin updates settings" on public.settings;
create policy "Public read settings" on public.settings for select to anon, authenticated using (true);
create policy "Company admin updates settings" on public.settings for update to authenticated
  using (public.is_company_admin(company_id)) with check (public.is_company_admin(company_id));

drop policy "Public read active barbers" on public.barbers;
drop policy "Admin manages barbers" on public.barbers;
create policy "Public read active barbers" on public.barbers for select to anon, authenticated
  using (is_active or public.is_company_member(company_id));
create policy "Company admin manages barbers" on public.barbers for all to authenticated
  using (public.is_company_admin(company_id)) with check (public.is_company_admin(company_id));

drop policy "Own profile or admin" on public.profiles;
create policy "Own profile or company admin" on public.profiles for select to authenticated
  using (id = auth.uid() or exists (
    select 1 from public.company_members m where m.user_id = profiles.id and public.is_company_admin(m.company_id)));

drop policy "Public read active services" on public.services;
drop policy "Admin manages services" on public.services;
create policy "Public read active services" on public.services for select to anon, authenticated
  using (is_active or public.is_company_member(company_id));
create policy "Company admin manages services" on public.services for all to authenticated
  using (public.is_company_admin(company_id)) with check (public.is_company_admin(company_id));

drop policy "Public read barber services" on public.barber_services;
drop policy "Admin manages barber services" on public.barber_services;
create policy "Public read barber services" on public.barber_services for select to anon, authenticated using (true);
create policy "Company admin manages barber services" on public.barber_services for all to authenticated
  using (public.is_company_admin(company_id)) with check (public.is_company_admin(company_id));

drop policy "Staff read working hours" on public.working_hours;
drop policy "Admin manages working hours" on public.working_hours;
create policy "Staff read working hours" on public.working_hours for select to authenticated
  using (public.is_company_admin(company_id) or barber_id = public.current_barber_id());
create policy "Company admin manages working hours" on public.working_hours for all to authenticated
  using (public.is_company_admin(company_id)) with check (public.is_company_admin(company_id));

drop policy "Staff read blocked times" on public.blocked_times;
drop policy "Admin manages blocked times" on public.blocked_times;
drop policy "Barber adds own blocks" on public.blocked_times;
drop policy "Barber removes own blocks" on public.blocked_times;
create policy "Staff read blocked times" on public.blocked_times for select to authenticated
  using (public.is_company_admin(company_id) or (barber_id is null and public.is_company_member(company_id)) or barber_id = public.current_barber_id());
create policy "Company admin manages blocked times" on public.blocked_times for all to authenticated
  using (public.is_company_admin(company_id)) with check (public.is_company_admin(company_id));
create policy "Barber adds own blocks" on public.blocked_times for insert to authenticated
  with check (barber_id is not null and barber_id = public.current_barber_id() and public.is_company_member(company_id));
create policy "Barber removes own blocks" on public.blocked_times for delete to authenticated
  using (barber_id is not null and barber_id = public.current_barber_id());

drop policy "Admin manages customers" on public.customers;
drop policy "Barber reads own customers" on public.customers;
create policy "Company admin manages customers" on public.customers for all to authenticated
  using (public.is_company_admin(company_id)) with check (public.is_company_admin(company_id));
create policy "Barber reads own customers" on public.customers for select to authenticated
  using (exists (select 1 from public.appointments a where a.customer_id = customers.id and a.barber_id = public.current_barber_id()));

drop policy "Admin manages appointments" on public.appointments;
drop policy "Barber reads own appointments" on public.appointments;
create policy "Company admin manages appointments" on public.appointments for all to authenticated
  using (public.is_company_admin(company_id)) with check (public.is_company_admin(company_id));
create policy "Barber reads own appointments" on public.appointments for select to authenticated
  using (barber_id = public.current_barber_id());

drop policy "Admin manages payments" on public.payments;
drop policy "Barber reads own payments" on public.payments;
create policy "Company admin manages payments" on public.payments for all to authenticated
  using (public.is_company_admin(company_id)) with check (public.is_company_admin(company_id));
create policy "Barber reads own payments" on public.payments for select to authenticated
  using (barber_id = public.current_barber_id());

drop policy "Public read products" on public.products;
drop policy "Admin manages products" on public.products;
create policy "Public read products" on public.products for select to anon, authenticated using (true);
create policy "Company admin manages products" on public.products for all to authenticated
  using (public.is_company_admin(company_id)) with check (public.is_company_admin(company_id));

drop policy "Public read approved reviews" on public.reviews;
drop policy "Admin moderates reviews" on public.reviews;
drop policy "Admin deletes reviews" on public.reviews;
create policy "Public read approved reviews" on public.reviews for select to anon, authenticated
  using (is_approved or public.is_company_admin(company_id) or barber_id = public.current_barber_id());
create policy "Company admin moderates reviews" on public.reviews for update to authenticated
  using (public.is_company_admin(company_id)) with check (public.is_company_admin(company_id));
create policy "Company admin deletes reviews" on public.reviews for delete to authenticated
  using (public.is_company_admin(company_id));

drop policy "Public read active videos" on public.site_videos;
drop policy "Admin manages videos" on public.site_videos;
create policy "Public read active videos" on public.site_videos for select to anon, authenticated
  using (is_active or public.is_company_admin(company_id));
create policy "Company admin manages videos" on public.site_videos for all to authenticated
  using (public.is_company_admin(company_id)) with check (public.is_company_admin(company_id));

drop policy "Admin reads notification settings" on public.notification_settings;
drop policy "Admin inserts notification settings" on public.notification_settings;
drop policy "Admin updates notification settings" on public.notification_settings;
create policy "Company admin reads notification settings" on public.notification_settings for select to authenticated
  using (public.is_company_admin(company_id));
create policy "Company admin inserts notification settings" on public.notification_settings for insert to authenticated
  with check (public.is_company_admin(company_id));
create policy "Company admin updates notification settings" on public.notification_settings for update to authenticated
  using (public.is_company_admin(company_id)) with check (public.is_company_admin(company_id));

-- ===== Storage: files live under {company_id}/...; old unprefixed files belong to the first company =====
create or replace function public.storage_company(_name text)
returns uuid language sql immutable set search_path = public as $$
  select case when split_part(_name, '/', 1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then split_part(_name, '/', 1)::uuid
    else 'a62dbf4c-26dd-4a83-86b5-7d2bcb01a4ee'::uuid end
$$;

drop policy "Admin uploads media" on storage.objects;
drop policy "Admin updates media" on storage.objects;
drop policy "Admin deletes media" on storage.objects;
drop policy "Admin uploads videos" on storage.objects;
drop policy "Admin updates videos" on storage.objects;
drop policy "Admin deletes videos" on storage.objects;
create policy "Company admin uploads media" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_company_admin(public.storage_company(name)));
create policy "Company admin updates media" on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.is_company_admin(public.storage_company(name)));
create policy "Company admin deletes media" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.is_company_admin(public.storage_company(name)));
create policy "Company admin uploads videos" on storage.objects for insert to authenticated
  with check (bucket_id = 'videos' and public.is_company_admin(public.storage_company(name)));
create policy "Company admin updates videos" on storage.objects for update to authenticated
  using (bucket_id = 'videos' and public.is_company_admin(public.storage_company(name)));
create policy "Company admin deletes videos" on storage.objects for delete to authenticated
  using (bucket_id = 'videos' and public.is_company_admin(public.storage_company(name)));

-- ===== Scheduling rules, now per company =====
create or replace function public.barber_slot_ok(p_barber uuid, p_start timestamptz, p_end timestamptz, p_ignore uuid default null)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare
  v_ls timestamp := p_start at time zone 'America/Maceio';
  v_le timestamp := p_end at time zone 'America/Maceio';
  v_dow int := extract(dow from v_ls)::int;
  v_oh jsonb;
  v_cid uuid;
begin
  if v_le::date <> v_ls::date then return false; end if;
  select company_id into v_cid from barbers where id = p_barber and is_active;
  if v_cid is null then return false; end if;

  select opening_hours -> v_dow::text into v_oh from settings where company_id = v_cid;
  if v_oh is null or jsonb_typeof(v_oh) <> 'object' or coalesce((v_oh ->> 'closed')::boolean, false) then return false; end if;
  if v_ls::time < (v_oh ->> 'open')::time or v_le::time > (v_oh ->> 'close')::time then return false; end if;

  if not exists (
    select 1 from working_hours w
    where w.barber_id = p_barber and w.day_of_week = v_dow and w.is_active
      and w.start_time <= v_ls::time and w.end_time >= v_le::time
  ) then return false; end if;

  if exists (
    select 1 from blocked_times b
    where (b.barber_id = p_barber or (b.barber_id is null and b.company_id = v_cid))
      and tstzrange(b.start_at, b.end_at, '[)') && tstzrange(p_start, p_end, '[)')
  ) then return false; end if;

  if exists (
    select 1 from appointments a
    where a.barber_id = p_barber and a.status in ('pending', 'confirmed', 'completed')
      and (p_ignore is null or a.id <> p_ignore)
      and tstzrange(a.start_at, a.end_at, '[)') && tstzrange(p_start, p_end, '[)')
  ) then return false; end if;

  return true;
end; $$;

create or replace function public.get_available_slots(p_service_id uuid, p_date date, p_barber_id uuid default null)
returns table (slot_start timestamptz, barber_ids uuid[])
language plpgsql stable security definer set search_path = public as $$
declare
  s settings;
  v_cid uuid;
  v_dur int;
  v_oh jsonb;
  v_local timestamp;
  v_close timestamp;
  v_start timestamptz;
  v_end timestamptz;
  v_today date := (now() at time zone 'America/Maceio')::date;
  v_ids uuid[];
begin
  select company_id, duration_minutes into v_cid, v_dur from services where id = p_service_id and is_active;
  if v_dur is null then return; end if;
  select * into s from settings where company_id = v_cid;
  if not found then return; end if;
  if p_date < v_today or p_date > v_today + s.max_advance_days then return; end if;

  v_oh := s.opening_hours -> extract(dow from p_date)::int::text;
  if v_oh is null or jsonb_typeof(v_oh) <> 'object' or coalesce((v_oh ->> 'closed')::boolean, false) then return; end if;

  v_local := p_date + (v_oh ->> 'open')::time;
  v_close := p_date + (v_oh ->> 'close')::time;

  while v_local + make_interval(mins => v_dur) <= v_close loop
    v_start := v_local at time zone 'America/Maceio';
    v_end := v_start + make_interval(mins => v_dur);
    if v_start >= now() + make_interval(mins => s.min_advance_minutes) then
      select array_agg(b.id order by b.name) into v_ids
      from barbers b
      join barber_services bs on bs.barber_id = b.id and bs.service_id = p_service_id
      where b.is_active and b.company_id = v_cid and (p_barber_id is null or b.id = p_barber_id)
        and public.barber_slot_ok(b.id, v_start, v_end, null);
      if v_ids is not null then
        slot_start := v_start; barber_ids := v_ids; return next;
      end if;
    end if;
    v_local := v_local + make_interval(mins => s.slot_interval_minutes);
  end loop;
end; $$;

create or replace function public.create_booking(
  p_service_id uuid, p_barber_id uuid, p_start_at timestamptz, p_full_name text, p_phone text
) returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  s settings;
  svc services;
  v_phone text := public.normalize_phone(p_phone);
  v_name text := btrim(coalesce(p_full_name, ''));
  v_end timestamptz;
  v_customer uuid;
  v_appt appointments;
  v_barber_name text;
  v_today date := (now() at time zone 'America/Maceio')::date;
begin
  if length(v_name) < 2 or length(v_name) > 120 then
    raise exception 'Informe seu nome completo.' using errcode = '22023';
  end if;
  if v_phone !~ '^[0-9]{10,11}$' then
    raise exception 'Número de WhatsApp inválido. Use DDD + número.' using errcode = '22023';
  end if;
  if p_barber_id is null then
    raise exception 'Escolha um profissional.' using errcode = '22023';
  end if;

  select * into svc from services where id = p_service_id and is_active;
  if not found then raise exception 'Serviço indisponível.' using errcode = '22023'; end if;
  select * into s from settings where company_id = svc.company_id;

  if p_start_at < now() + make_interval(mins => s.min_advance_minutes)
     or (p_start_at at time zone 'America/Maceio')::date > v_today + s.max_advance_days then
    raise exception 'Este horário não está disponível para agendamento.' using errcode = '22023';
  end if;

  v_end := p_start_at + make_interval(mins => svc.duration_minutes);

  if not exists (select 1 from barber_services where barber_id = p_barber_id and service_id = p_service_id and company_id = svc.company_id)
     or not public.barber_slot_ok(p_barber_id, p_start_at, v_end, null) then
    raise exception 'Este horário acabou de ser ocupado. Escolha outro horário.' using errcode = 'P0001';
  end if;

  if (select count(*) from appointments a join customers c on c.id = a.customer_id
      where c.company_id = svc.company_id and c.phone = v_phone and a.source = 'online'
        and a.status in ('pending', 'confirmed') and a.start_at > now()) >= 3 then
    raise exception 'Você já tem 3 agendamentos futuros. Fale com o estabelecimento pelo WhatsApp.' using errcode = 'P0001';
  end if;

  insert into customers (company_id, full_name, phone) values (svc.company_id, v_name, v_phone)
  on conflict (company_id, phone) do update set phone = excluded.phone
  returning id into v_customer;

  begin
    insert into appointments (company_id, customer_id, barber_id, service_id, service_name, start_at, end_at, duration_minutes, price, status, source)
    values (svc.company_id, v_customer, p_barber_id, svc.id, svc.name, p_start_at, v_end, svc.duration_minutes, svc.price, 'confirmed', 'online')
    returning * into v_appt;
  exception when exclusion_violation then
    raise exception 'Este horário acabou de ser ocupado. Escolha outro horário.' using errcode = 'P0001';
  end;

  select name into v_barber_name from barbers where id = p_barber_id;

  return jsonb_build_object(
    'id', v_appt.id, 'token', v_appt.manage_token, 'service_name', v_appt.service_name,
    'barber_name', v_barber_name, 'start_at', v_appt.start_at, 'end_at', v_appt.end_at,
    'duration_minutes', v_appt.duration_minutes, 'price', v_appt.price, 'customer_name', v_name,
    'status', v_appt.status
  );
end; $$;

create or replace function public.admin_create_booking(
  p_service_id uuid, p_barber_id uuid, p_start_at timestamptz, p_full_name text, p_phone text, p_notes text default null
) returns uuid language plpgsql volatile security definer set search_path = public as $$
declare
  svc services;
  v_phone text := public.normalize_phone(p_phone);
  v_name text := btrim(coalesce(p_full_name, ''));
  v_end timestamptz;
  v_customer uuid;
  v_id uuid;
begin
  select * into svc from services where id = p_service_id;
  if not found then raise exception 'Serviço não encontrado.' using errcode = '22023'; end if;
  if not public.is_company_admin(svc.company_id) then
    raise exception 'Apenas o administrador pode criar agendamentos manualmente.' using errcode = '42501';
  end if;
  if not exists (select 1 from barbers where id = p_barber_id and company_id = svc.company_id) then
    raise exception 'Profissional não encontrado.' using errcode = '22023';
  end if;
  if length(v_name) < 2 then raise exception 'Informe o nome do cliente.' using errcode = '22023'; end if;
  if v_phone !~ '^[0-9]{10,11}$' then raise exception 'Telefone inválido. Use DDD + número.' using errcode = '22023'; end if;
  v_end := p_start_at + make_interval(mins => svc.duration_minutes);
  if not public.barber_slot_ok(p_barber_id, p_start_at, v_end, null) then
    raise exception 'O profissional não está disponível neste horário.' using errcode = 'P0001';
  end if;
  insert into customers (company_id, full_name, phone) values (svc.company_id, v_name, v_phone)
  on conflict (company_id, phone) do update set phone = excluded.phone
  returning id into v_customer;
  begin
    insert into appointments (company_id, customer_id, barber_id, service_id, service_name, start_at, end_at, duration_minutes, price, status, source, notes)
    values (svc.company_id, v_customer, p_barber_id, svc.id, svc.name, p_start_at, v_end, svc.duration_minutes, svc.price, 'confirmed', 'admin', nullif(btrim(coalesce(p_notes, '')), ''))
    returning id into v_id;
  exception when exclusion_violation then
    raise exception 'Já existe agendamento neste horário para este profissional.' using errcode = 'P0001';
  end;
  return v_id;
end; $$;

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
    'logo_url', s.logo_url, 'brand_primary', s.brand_primary, 'brand_background', s.brand_background, 'brand_text', s.brand_text
  );
end; $$;

create or replace function public.cancel_booking(p_token uuid)
returns boolean language plpgsql volatile security definer set search_path = public as $$
declare v_id uuid;
begin
  update appointments a set status = 'cancelled'
  from settings s
  where s.company_id = a.company_id and a.manage_token = p_token and a.status in ('pending', 'confirmed')
    and a.start_at - now() >= make_interval(hours => s.cancellation_min_hours)
  returning a.id into v_id;
  if v_id is null then
    raise exception 'Não é possível cancelar este agendamento pelo site. Fale com o estabelecimento pelo WhatsApp.' using errcode = 'P0001';
  end if;
  return true;
end; $$;

create or replace function public.submit_review(p_token uuid, p_rating int, p_comment text)
returns boolean language plpgsql volatile security definer set search_path = public as $$
declare a appointments; v_name text; v_parts text[]; v_display text;
begin
  if p_rating is null or p_rating < 1 or p_rating > 5 then
    raise exception 'Escolha uma nota de 1 a 5 estrelas.' using errcode = '22023';
  end if;
  if p_comment is not null and length(p_comment) > 1000 then
    raise exception 'O comentário pode ter no máximo 1000 caracteres.' using errcode = '22023';
  end if;
  select * into a from appointments where manage_token = p_token;
  if not found or a.status <> 'completed' then
    raise exception 'Só é possível avaliar atendimentos concluídos.' using errcode = 'P0001';
  end if;
  if exists (select 1 from reviews where appointment_id = a.id) then
    raise exception 'Este atendimento já foi avaliado. Obrigado!' using errcode = 'P0001';
  end if;
  select full_name into v_name from customers where id = a.customer_id;
  v_parts := regexp_split_to_array(btrim(v_name), '\s+');
  v_display := v_parts[1] || case when array_length(v_parts, 1) > 1 then ' ' || left(v_parts[array_length(v_parts, 1)], 1) || '.' else '' end;
  insert into reviews (company_id, appointment_id, customer_id, barber_id, reviewer_name, rating, comment)
  values (a.company_id, a.id, a.customer_id, a.barber_id, v_display, p_rating, nullif(btrim(coalesce(p_comment, '')), ''));
  return true;
end; $$;

create or replace function public.update_appointment_status(p_id uuid, p_status public.appointment_status)
returns boolean language plpgsql volatile security definer set search_path = public as $$
declare a appointments;
begin
  select * into a from appointments where id = p_id;
  if not found then raise exception 'Agendamento não encontrado.' using errcode = 'P0002'; end if;
  if not public.is_company_admin(a.company_id) then
    if a.barber_id is distinct from public.current_barber_id() or p_status not in ('confirmed', 'completed', 'no_show') then
      raise exception 'Você não tem permissão para esta alteração.' using errcode = '42501';
    end if;
  end if;
  begin
    update appointments set status = p_status where id = p_id;
  exception when exclusion_violation then
    raise exception 'Já existe outro agendamento neste horário para este profissional.' using errcode = 'P0001';
  end;
  return true;
end; $$;

-- ===== Self-service company creation =====
create or replace function public.slug_problem(p_slug text)
returns text language sql stable security definer set search_path = public as $$
  select case
    when v !~ '^[a-z0-9]([a-z0-9-]{1,46}[a-z0-9])$' or v ~ '--' then 'invalid'
    when v = any (array['admin','auth','agendar','agendamento','cadastro','comecar','api','lovable','reset-password',
      'profissional','entrar','login','logout','sair','conta','painel','app','www','static','assets','robots','sitemap',
      'favicon','sobre','ajuda','suporte','termos','privacidade','planos','precos','contato','blog','empresa','empresas']) then 'reserved'
    when exists (select 1 from public.companies where slug = v) then 'taken'
    else null end
  from (select lower(btrim(coalesce(p_slug, ''))) as v) x
$$;

create or replace function public.create_company(p_name text, p_slug text, p_type text)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_slug text := lower(btrim(coalesce(p_slug, '')));
  v_name text := btrim(coalesce(p_name, ''));
  v_type text := coalesce(nullif(btrim(p_type), ''), 'outro');
  v_problem text;
  v_id uuid;
begin
  if v_uid is null then raise exception 'Entre na sua conta primeiro.' using errcode = '42501'; end if;
  if exists (select 1 from company_members where user_id = v_uid) then
    raise exception 'Sua conta já está ligada a uma empresa.' using errcode = 'P0001';
  end if;
  if length(v_name) < 2 or length(v_name) > 120 then
    raise exception 'Informe o nome da empresa.' using errcode = '22023';
  end if;
  v_problem := public.slug_problem(v_slug);
  if v_problem = 'invalid' then
    raise exception 'O link deve ter de 3 a 48 letras minúsculas, números ou hífen.' using errcode = '22023';
  elsif v_problem is not null then
    raise exception 'Esse link já está em uso. Escolha outro.' using errcode = 'P0001';
  end if;
  if v_type not in ('barbearia','salao','estetica','manicure','tatuagem','clinica','outro') then v_type := 'outro'; end if;

  begin
    insert into companies (slug, name, business_type, created_by) values (v_slug, v_name, v_type, v_uid) returning id into v_id;
  exception when unique_violation then
    raise exception 'Esse link já está em uso. Escolha outro.' using errcode = 'P0001';
  end;
  insert into settings (company_id, business_name) values (v_id, v_name);
  insert into notification_settings (company_id, pushcut_enabled) values (v_id, false);
  insert into company_members (company_id, user_id, role) values (v_id, v_uid, 'admin');
  return jsonb_build_object('id', v_id, 'slug', v_slug);
end; $$;

revoke execute on function public.create_company(text, text, text) from public, anon;
grant execute on function public.create_company(text, text, text) to authenticated;
grant execute on function public.slug_problem(text) to anon, authenticated;
grant execute on function public.current_company_id() to authenticated;
grant execute on function public.is_company_admin(uuid) to authenticated;
grant execute on function public.is_company_member(uuid) to authenticated;
revoke execute on function public.barber_slot_ok(uuid, timestamptz, timestamptz, uuid) from public, anon, authenticated;
grant execute on function public.get_available_slots(uuid, date, uuid) to anon, authenticated;
grant execute on function public.create_booking(uuid, uuid, timestamptz, text, text) to anon, authenticated;
grant execute on function public.get_booking(uuid) to anon, authenticated;
grant execute on function public.cancel_booking(uuid) to anon, authenticated;
grant execute on function public.submit_review(uuid, int, text) to anon, authenticated;
revoke execute on function public.admin_create_booking(uuid, uuid, timestamptz, text, text, text) from public, anon;
grant execute on function public.admin_create_booking(uuid, uuid, timestamptz, text, text, text) to authenticated;
revoke execute on function public.update_appointment_status(uuid, public.appointment_status) from public, anon;
grant execute on function public.update_appointment_status(uuid, public.appointment_status) to authenticated;