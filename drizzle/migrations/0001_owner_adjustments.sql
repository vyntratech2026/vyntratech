alter table public.payments add column kind text not null default 'service' check (kind in ('service', 'product'));
alter table public.payments add column product_id uuid references public.products(id) on delete set null;
alter table public.settings alter column cancellation_min_hours set default 1;

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
    raise exception 'Escolha um barbeiro.' using errcode = '22023';
  end if;

  select * into s from settings where id = 1;
  select * into svc from services where id = p_service_id and is_active;
  if not found then raise exception 'Serviço indisponível.' using errcode = '22023'; end if;

  if p_start_at < now() + make_interval(mins => s.min_advance_minutes)
     or (p_start_at at time zone 'America/Maceio')::date > v_today + s.max_advance_days then
    raise exception 'Este horário não está disponível para agendamento.' using errcode = '22023';
  end if;

  v_end := p_start_at + make_interval(mins => svc.duration_minutes);

  if not exists (select 1 from barber_services where barber_id = p_barber_id and service_id = p_service_id)
     or not public.barber_slot_ok(p_barber_id, p_start_at, v_end, null) then
    raise exception 'Este horário acabou de ser ocupado. Escolha outro horário.' using errcode = 'P0001';
  end if;

  if (select count(*) from appointments a join customers c on c.id = a.customer_id
      where c.phone = v_phone and a.source = 'online' and a.status in ('pending', 'confirmed') and a.start_at > now()) >= 3 then
    raise exception 'Você já tem 3 agendamentos futuros. Fale com a barbearia pelo WhatsApp.' using errcode = 'P0001';
  end if;

  insert into customers (full_name, phone) values (v_name, v_phone)
  on conflict (phone) do update set phone = excluded.phone
  returning id into v_customer;

  begin
    insert into appointments (customer_id, barber_id, service_id, service_name, start_at, end_at, duration_minutes, price, status, source)
    values (v_customer, p_barber_id, svc.id, svc.name, p_start_at, v_end, svc.duration_minutes, svc.price, 'confirmed', 'online')
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

grant execute on function public.create_booking(uuid, uuid, timestamptz, text, text) to anon, authenticated;
