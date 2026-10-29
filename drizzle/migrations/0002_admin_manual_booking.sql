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
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'Apenas o administrador pode criar agendamentos manualmente.' using errcode = '42501';
  end if;
  if length(v_name) < 2 then raise exception 'Informe o nome do cliente.' using errcode = '22023'; end if;
  if v_phone !~ '^[0-9]{10,11}$' then raise exception 'Telefone inválido. Use DDD + número.' using errcode = '22023'; end if;
  select * into svc from services where id = p_service_id;
  if not found then raise exception 'Serviço não encontrado.' using errcode = '22023'; end if;
  v_end := p_start_at + make_interval(mins => svc.duration_minutes);
  if not public.barber_slot_ok(p_barber_id, p_start_at, v_end, null) then
    raise exception 'O barbeiro não está disponível neste horário.' using errcode = 'P0001';
  end if;
  insert into customers (full_name, phone) values (v_name, v_phone)
  on conflict (phone) do update set phone = excluded.phone
  returning id into v_customer;
  begin
    insert into appointments (customer_id, barber_id, service_id, service_name, start_at, end_at, duration_minutes, price, status, source, notes)
    values (v_customer, p_barber_id, svc.id, svc.name, p_start_at, v_end, svc.duration_minutes, svc.price, 'confirmed', 'admin', nullif(btrim(coalesce(p_notes, '')), ''))
    returning id into v_id;
  exception when exclusion_violation then
    raise exception 'Já existe agendamento neste horário para este barbeiro.' using errcode = 'P0001';
  end;
  return v_id;
end; $$;

revoke execute on function public.admin_create_booking(uuid, uuid, timestamptz, text, text, text) from public, anon;
grant execute on function public.admin_create_booking(uuid, uuid, timestamptz, text, text, text) to authenticated;
