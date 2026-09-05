-- Run this once in Supabase SQL Editor.
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null
);

alter table public.site_settings enable row level security;

drop policy if exists "Public can read site settings" on public.site_settings;
create policy "Public can read site settings"
on public.site_settings for select
to anon, authenticated
using (true);

drop policy if exists "Authenticated admins can write site settings" on public.site_settings;
create policy "Authenticated admins can write site settings"
on public.site_settings for insert
to authenticated
with check (true);

drop policy if exists "Authenticated admins can update site settings" on public.site_settings;
create policy "Authenticated admins can update site settings"
on public.site_settings for update
to authenticated
using (true)
with check (true);

insert into public.site_settings(key,value)
values ('total_result_visible','true'::jsonb)
on conflict (key) do nothing;
