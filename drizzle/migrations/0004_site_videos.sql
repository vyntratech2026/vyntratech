create table public.site_videos (
  id uuid primary key default gen_random_uuid(),
  title text check (title is null or length(title) <= 120),
  video_path text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index site_videos_order_idx on public.site_videos (sort_order, created_at);

grant select (id, title, video_path, sort_order, is_active, created_at) on public.site_videos to anon;
grant select, insert, update, delete on public.site_videos to authenticated;
grant all on public.site_videos to service_role;

alter table public.site_videos enable row level security;

create policy "Public read active videos" on public.site_videos for select to anon, authenticated
  using (is_active or public.has_role(auth.uid(), 'admin'));
create policy "Admin manages videos" on public.site_videos for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create policy "Public read videos bucket" on storage.objects for select to anon, authenticated using (bucket_id = 'videos');
create policy "Admin uploads videos" on storage.objects for insert to authenticated
  with check (bucket_id = 'videos' and public.has_role(auth.uid(), 'admin'));
create policy "Admin updates videos" on storage.objects for update to authenticated
  using (bucket_id = 'videos' and public.has_role(auth.uid(), 'admin'));
create policy "Admin deletes videos" on storage.objects for delete to authenticated
  using (bucket_id = 'videos' and public.has_role(auth.uid(), 'admin'));
