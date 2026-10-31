create table public.notification_settings (
  id smallint primary key default 1 check (id = 1),
  pushcut_enabled boolean not null default true,
  pushcut_url text check (pushcut_url is null or pushcut_url ~ '^https://api\.pushcut\.io/'),
  updated_at timestamptz not null default now()
);
create trigger notification_settings_updated_at before update on public.notification_settings
  for each row execute function public.set_updated_at();

grant select, insert, update on public.notification_settings to authenticated;
grant all on public.notification_settings to service_role;

alter table public.notification_settings enable row level security;

create policy "Admin reads notification settings" on public.notification_settings for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));
create policy "Admin inserts notification settings" on public.notification_settings for insert to authenticated
  with check (public.has_role(auth.uid(), 'admin'));
create policy "Admin updates notification settings" on public.notification_settings for update to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

insert into public.notification_settings (id, pushcut_enabled, pushcut_url)
values (1, true, 'https://api.pushcut.io/ED0YW0nXfIfqsLxYViDqb/notifications/Novo%20agendamento!');

alter table public.appointments add column notified_at timestamptz;