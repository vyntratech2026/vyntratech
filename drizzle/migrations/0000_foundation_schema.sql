create extension if not exists btree_gist;

create type public.app_role as enum ('admin', 'barber');
create type public.appointment_status as enum ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');
create type public.payment_method as enum ('cash', 'pix', 'credit_card', 'debit_card', 'other');

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at := now(); return new; end; $$;

create or replace function public.normalize_phone(p text)
returns text language sql immutable set search_path = public as $$
  select case when d ~ '^55[0-9]{10,11}$' then substr(d, 3) else d end
  from (select regexp_replace(coalesce(p, ''), '\D', '', 'g') as d) s
$$;

create table public.settings (
  id smallint primary key default 1 check (id = 1),
  business_name text not null default 'Studio Cleison Cortes',
  tagline text,
  description text,
  logo_url text,
  cover_url text,
  address text,
  phone text,
  whatsapp text,
  instagram text,
  maps_url text,
  opening_hours jsonb not null default '{}'::jsonb,
  slot_interval_minutes int not null default 30 check (slot_interval_minutes between 5 and 120),
  min_advance_minutes int not null default 60 check (min_advance_minutes between 0 and 10080),
  max_advance_days int not null default 30 check (max_advance_days between 1 and 365),
  cancellation_min_hours int not null default 2 check (cancellation_min_hours between 0 and 168),
  cancellation_policy text,
  notification_email text,
  updated_at timestamptz not null default now()
);
create trigger settings_updated_at before update on public.settings for each row execute function public.set_updated_at();

insert into public.settings (id, business_name, address, phone, whatsapp, instagram, maps_url)
values (1, 'Studio Cleison Cortes', 'Rua Urbano Neto, 763, Aracaju – Sergipe', '(79) 99689-1622', '5579996891622',
  'https://www.instagram.com/studiocleisoncortes/',
  'https://www.google.com/maps/search/?api=1&query=Rua+Urbano+Neto+763+Aracaju+SE');

create table public.barbers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique,
  name text not null check (length(btrim(name)) between 2 and 120),
  photo_url text,
  description text,
  specialties text[] not null default '{}',
  phone text,
  commission_percent numeric(5,2) not null default 0 check (commission_percent between 0 and 100),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  barber_id uuid references public.barbers(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.current_barber_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.barbers where user_id = auth.uid() limit 1
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'barber')
$$;

create or replace function public.admin_exists()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where role = 'admin')
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, nullif(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 2 and 120),
  description text,
  photo_url text,
  price numeric(10,2) not null check (price >= 0),
  duration_minutes int not null check (duration_minutes between 5 and 480),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.barber_services (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid not null references public.barbers(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  unique (barber_id, service_id)
);

create table public.working_hours (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid not null references public.barbers(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  is_active boolean not null default true,
  check (end_time > start_time)
);
create index working_hours_barber_idx on public.working_hours (barber_id, day_of_week);

create table public.blocked_times (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid references public.barbers(id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null,
  reason text,
  created_at timestamptz not null default now(),
  check (end_at > start_at)
);
create index blocked_times_range_idx on public.blocked_times using gist (tstzrange(start_at, end_at));

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (length(btrim(full_name)) between 2 and 120),
  phone text not null unique check (phone ~ '^[0-9]{10,11}$'),
  notes text,
  created_at timestamptz not null default now()
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete restrict,
  barber_id uuid not null references public.barbers(id) on delete restrict,
  service_id uuid not null references public.services(id) on delete restrict,
  service_name text not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  duration_minutes int not null,
  price numeric(10,2) not null check (price >= 0),
  status public.appointment_status not null default 'pending',
  notes text,
  source text not null default 'online' check (source in ('online', 'admin')),
  manage_token uuid not null unique default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_at > start_at),
  constraint appointments_no_overlap exclude using gist (
    barber_id with =, tstzrange(start_at, end_at, '[)') with &&
  ) where (status in ('pending', 'confirmed', 'completed'))
);
create index appointments_start_idx on public.appointments (start_at);
create index appointments_customer_idx on public.appointments (customer_id);
create trigger appointments_updated_at before update on public.appointments for each row execute function public.set_updated_at();

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references public.appointments(id) on delete restrict,
  customer_id uuid references public.customers(id) on delete set null,
  barber_id uuid references public.barbers(id) on delete set null,
  amount numeric(10,2) not null check (amount > 0),
  payment_method public.payment_method not null,
  payment_date timestamptz not null default now(),
  notes text,
  created_by uuid,
  created_at timestamptz not null default now()
);
create index payments_date_idx on public.payments (payment_date);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 2 and 120),
  description text,
  photo_url text,
  price numeric(10,2) not null check (price >= 0),
  is_available boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null unique references public.appointments(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  barber_id uuid references public.barbers(id) on delete set null,
  reviewer_name text not null,
  rating smallint not null check (rating between 1 and 5),
  comment text check (comment is null or length(comment) <= 1000),
  is_approved boolean not null default false,
  created_at timestamptz not null default now()
);

-- GRANTS
grant select (id, business_name, tagline, description, logo_url, cover_url, address, phone, whatsapp, instagram, maps_url,
  opening_hours, slot_interval_minutes, min_advance_minutes, max_advance_days, cancellation_min_hours, cancellation_policy)
  on public.settings to anon;
grant select, update on public.settings to authenticated;
grant all on public.settings to service_role;

grant select (id, name, photo_url, description, specialties, is_active) on public.barbers to anon;
grant select, insert, update, delete on public.barbers to authenticated;
grant all on public.barbers to service_role;

grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

grant select on public.services to anon;
grant select, insert, update, delete on public.services to authenticated;
grant all on public.services to service_role;

grant select on public.barber_services to anon;
grant select, insert, update, delete on public.barber_services to authenticated;
grant all on public.barber_services to service_role;

grant select, insert, update, delete on public.working_hours to authenticated;
grant all on public.working_hours to service_role;

grant select, insert, update, delete on public.blocked_times to authenticated;
grant all on public.blocked_times to service_role;

grant select, insert, update, delete on public.customers to authenticated;
grant all on public.customers to service_role;

grant select, insert, update, delete on public.appointments to authenticated;
grant all on public.appointments to service_role;

grant select, insert, update, delete on public.payments to authenticated;
grant all on public.payments to service_role;

grant select on public.products to anon;
grant select, insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;

grant select (id, reviewer_name, rating, comment, is_approved, created_at) on public.reviews to anon;
grant select, update, delete on public.reviews to authenticated;
grant all on public.reviews to service_role;

-- RLS
alter table public.settings enable row level security;
alter table public.barbers enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.services enable row level security;
alter table public.barber_services enable row level security;
alter table public.working_hours enable row level security;
alter table public.blocked_times enable row level security;
alter table public.customers enable row level security;
alter table public.appointments enable row level security;
alter table public.payments enable row level security;
alter table public.products enable row level security;
alter table public.reviews enable row level security;

create policy "Public read settings" on public.settings for select to anon, authenticated using (true);
create policy "Admin updates settings" on public.settings for update to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create policy "Public read active barbers" on public.barbers for select to anon, authenticated
  using (is_active or public.is_staff());
create policy "Admin manages barbers" on public.barbers for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create policy "Own profile or admin" on public.profiles for select to authenticated
  using (id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "Update own profile" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy "Own roles or admin" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create policy "Public read active services" on public.services for select to anon, authenticated
  using (is_active or public.is_staff());
create policy "Admin manages services" on public.services for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create policy "Public read barber services" on public.barber_services for select to anon, authenticated using (true);
create policy "Admin manages barber services" on public.barber_services for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create policy "Staff read working hours" on public.working_hours for select to authenticated
  using (public.has_role(auth.uid(), 'admin') or barber_id = public.current_barber_id());
create policy "Admin manages working hours" on public.working_hours for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create policy "Staff read blocked times" on public.blocked_times for select to authenticated
  using (public.has_role(auth.uid(), 'admin') or barber_id is null or barber_id = public.current_barber_id());
create policy "Admin manages blocked times" on public.blocked_times for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Barber adds own blocks" on public.blocked_times for insert to authenticated
  with check (barber_id is not null and barber_id = public.current_barber_id());
create policy "Barber removes own blocks" on public.blocked_times for delete to authenticated
  using (barber_id is not null and barber_id = public.current_barber_id());

create policy "Admin manages customers" on public.customers for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Barber reads own customers" on public.customers for select to authenticated
  using (exists (select 1 from public.appointments a where a.customer_id = customers.id and a.barber_id = public.current_barber_id()));

create policy "Admin manages appointments" on public.appointments for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Barber reads own appointments" on public.appointments for select to authenticated
  using (barber_id = public.current_barber_id());

create policy "Admin manages payments" on public.payments for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Barber reads own payments" on public.payments for select to authenticated
  using (barber_id = public.current_barber_id());

create policy "Public read products" on public.products for select to anon, authenticated using (true);
create policy "Admin manages products" on public.products for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create policy "Public read approved reviews" on public.reviews for select to anon, authenticated
  using (is_approved or public.has_role(auth.uid(), 'admin') or barber_id = public.current_barber_id());
create policy "Admin moderates reviews" on public.reviews for update to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Admin deletes reviews" on public.reviews for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- availability
create or replace function public.barber_slot_ok(p_barber uuid, p_start timestamptz, p_end timestamptz, p_ignore uuid default null)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare
  v_ls timestamp := p_start at time zone 'America/Maceio';
  v_le timestamp := p_end at time zone 'America/Maceio';
  v_dow int := extract(dow from v_ls)::int;
  v_oh jsonb;
begin
  if v_le::date <> v_ls::date then return false; end if;
  if not exists (select 1 from barbers where id = p_barber and is_active) then return false; end if;

  select opening_hours -> v_dow::text into v_oh from settings where id = 1;
  if v_oh is null or jsonb_typeof(v_oh) <> 'object' or coalesce((v_oh ->> 'closed')::boolean, false) then return false; end if;
  if v_ls::time < (v_oh ->> 'open')::time or v_le::time > (v_oh ->> 'close')::time then return false; end if;

  if not exists (
    select 1 from working_hours w
    where w.barber_id = p_barber and w.day_of_week = v_dow and w.is_active
      and w.start_time <= v_ls::time and w.end_time >= v_le::time
  ) then return false; end if;

  if exists (
    select 1 from blocked_times b
    where (b.barber_id = p_barber or b.barber_id is null)
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
  v_dur int;
  v_oh jsonb;
  v_local timestamp;
  v_close timestamp;
  v_start timestamptz;
  v_end timestamptz;
  v_today date := (now() at time zone 'America/Maceio')::date;
  v_ids uuid[];
begin
  select * into s from settings where id = 1;
  select duration_minutes into v_dur from services where id = p_service_id and is_active;
  if v_dur is null then return; end if;
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
      where b.is_active and (p_barber_id is null or b.id = p_barber_id)
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
  v_barber uuid;
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

  select * into s from settings where id = 1;
  select * into svc from services where id = p_service_id and is_active;
  if not found then raise exception 'Serviço indisponível.' using errcode = '22023'; end if;

  if p_start_at < now() + make_interval(mins => s.min_advance_minutes)
     or (p_start_at at time zone 'America/Maceio')::date > v_today + s.max_advance_days then
    raise exception 'Este horário não está disponível para agendamento.' using errcode = '22023';
  end if;

  v_end := p_start_at + make_interval(mins => svc.duration_minutes);

  if p_barber_id is not null then
    if exists (select 1 from barber_services where barber_id = p_barber_id and service_id = p_service_id)
       and public.barber_slot_ok(p_barber_id, p_start_at, v_end, null) then
      v_barber := p_barber_id;
    end if;
  else
    select b.id into v_barber
    from barbers b
    join barber_services bs on bs.barber_id = b.id and bs.service_id = p_service_id
    where b.is_active and public.barber_slot_ok(b.id, p_start_at, v_end, null)
    order by (
      select count(*) from appointments a
      where a.barber_id = b.id and a.status in ('pending', 'confirmed')
        and (a.start_at at time zone 'America/Maceio')::date = (p_start_at at time zone 'America/Maceio')::date
    ), random()
    limit 1;
  end if;

  if v_barber is null then
    raise exception 'Este horário acabou de ser ocupado. Escolha outro horário.' using errcode = 'P0001';
  end if;

  if (select count(*) from appointments a join customers c on c.id = a.customer_id
      where c.phone = v_phone and a.status = 'pending' and a.start_at > now()) >= 3 then
    raise exception 'Você já tem agendamentos aguardando confirmação. Fale com a barbearia pelo WhatsApp.' using errcode = 'P0001';
  end if;

  insert into customers (full_name, phone) values (v_name, v_phone)
  on conflict (phone) do update set phone = excluded.phone
  returning id into v_customer;

  begin
    insert into appointments (customer_id, barber_id, service_id, service_name, start_at, end_at, duration_minutes, price, status, source)
    values (v_customer, v_barber, svc.id, svc.name, p_start_at, v_end, svc.duration_minutes, svc.price, 'pending', 'online')
    returning * into v_appt;
  exception when exclusion_violation then
    raise exception 'Este horário acabou de ser ocupado. Escolha outro horário.' using errcode = 'P0001';
  end;

  select name into v_barber_name from barbers where id = v_barber;

  return jsonb_build_object(
    'id', v_appt.id, 'token', v_appt.manage_token, 'service_name', v_appt.service_name,
    'barber_name', v_barber_name, 'start_at', v_appt.start_at, 'end_at', v_appt.end_at,
    'duration_minutes', v_appt.duration_minutes, 'price', v_appt.price, 'customer_name', v_name
  );
end; $$;

create or replace function public.get_booking(p_token uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare r record; v_hours int;
begin
  select a.*, b.name as barber_name, c.full_name as customer_name,
    exists (select 1 from reviews rv where rv.appointment_id = a.id) as has_review
  into r
  from appointments a join barbers b on b.id = a.barber_id join customers c on c.id = a.customer_id
  where a.manage_token = p_token;
  if not found then return null; end if;
  select cancellation_min_hours into v_hours from settings where id = 1;
  return jsonb_build_object(
    'service_name', r.service_name, 'barber_name', r.barber_name, 'customer_name', r.customer_name,
    'start_at', r.start_at, 'end_at', r.end_at, 'duration_minutes', r.duration_minutes, 'price', r.price,
    'status', r.status, 'has_review', r.has_review, 'cancellation_min_hours', v_hours,
    'can_cancel', r.status in ('pending', 'confirmed') and r.start_at - now() >= make_interval(hours => v_hours),
    'can_review', r.status = 'completed' and not r.has_review
  );
end; $$;

create or replace function public.cancel_booking(p_token uuid)
returns boolean language plpgsql volatile security definer set search_path = public as $$
declare v_hours int; v_id uuid;
begin
  select cancellation_min_hours into v_hours from settings where id = 1;
  update appointments set status = 'cancelled'
  where manage_token = p_token and status in ('pending', 'confirmed')
    and start_at - now() >= make_interval(hours => v_hours)
  returning id into v_id;
  if v_id is null then
    raise exception 'Não é possível cancelar este agendamento pelo site. Fale com a barbearia pelo WhatsApp.' using errcode = 'P0001';
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
  insert into reviews (appointment_id, customer_id, barber_id, reviewer_name, rating, comment)
  values (a.id, a.customer_id, a.barber_id, v_display, p_rating, nullif(btrim(coalesce(p_comment, '')), ''));
  return true;
end; $$;

create or replace function public.update_appointment_status(p_id uuid, p_status public.appointment_status)
returns boolean language plpgsql volatile security definer set search_path = public as $$
declare a appointments;
begin
  select * into a from appointments where id = p_id;
  if not found then raise exception 'Agendamento não encontrado.' using errcode = 'P0002'; end if;
  if not public.has_role(auth.uid(), 'admin') then
    if a.barber_id is distinct from public.current_barber_id() or p_status not in ('confirmed', 'completed', 'no_show') then
      raise exception 'Você não tem permissão para esta alteração.' using errcode = '42501';
    end if;
  end if;
  begin
    update appointments set status = p_status where id = p_id;
  exception when exclusion_violation then
    raise exception 'Já existe outro agendamento neste horário para este barbeiro.' using errcode = 'P0001';
  end;
  return true;
end; $$;

revoke execute on function public.barber_slot_ok(uuid, timestamptz, timestamptz, uuid) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.get_available_slots(uuid, date, uuid) to anon, authenticated;
grant execute on function public.create_booking(uuid, uuid, timestamptz, text, text) to anon, authenticated;
grant execute on function public.get_booking(uuid) to anon, authenticated;
grant execute on function public.cancel_booking(uuid) to anon, authenticated;
grant execute on function public.submit_review(uuid, int, text) to anon, authenticated;
grant execute on function public.admin_exists() to anon, authenticated;
revoke execute on function public.update_appointment_status(uuid, public.appointment_status) from public, anon;
grant execute on function public.update_appointment_status(uuid, public.appointment_status) to authenticated;

-- storage policies (private bucket, signed URLs)
create policy "Public read media" on storage.objects for select to anon, authenticated using (bucket_id = 'media');
create policy "Admin uploads media" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.has_role(auth.uid(), 'admin'));
create policy "Admin updates media" on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.has_role(auth.uid(), 'admin'));
create policy "Admin deletes media" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.has_role(auth.uid(), 'admin'));
