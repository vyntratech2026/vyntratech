alter table public.settings
  add column brand_primary text not null default '#aff608' check (brand_primary ~ '^#[0-9a-fA-F]{6}$'),
  add column brand_background text not null default '#080808' check (brand_background ~ '^#[0-9a-fA-F]{6}$'),
  add column brand_text text not null default '#ffffff' check (brand_text ~ '^#[0-9a-fA-F]{6}$');

grant select (brand_primary, brand_background, brand_text) on public.settings to anon;