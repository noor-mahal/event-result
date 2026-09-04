-- ============================================================
-- Sirajul Huda / Meelad Fest 2K26 — Supabase schema
-- Run this once in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- 1. TABLES -----------------------------------------------------

create table if not exists groups (
  id   text primary key,
  name text not null
);

create table if not exists students (
  id           text primary key,
  group_id     text not null references groups(id) on delete cascade,
  student_code text not null,          -- e.g. "K01" (shown in the UI as Student ID)
  name         text not null
);

create table if not exists competitions (
  id       text primary key,
  name     text not null,
  category text not null
);

-- One row per competition. first/second/third hold arrays like
-- [{"groupId":"g1","studentId":"K01"}, ...] so multiple students can share a place.
create table if not exists results (
  competition_id text primary key references competitions(id) on delete cascade,
  first          jsonb not null default '[]'::jsonb,
  second         jsonb not null default '[]'::jsonb,
  third          jsonb not null default '[]'::jsonb,
  published      boolean not null default false,
  updated_at     timestamptz not null default now()
);

create table if not exists gallery (
  id                bigint generated always as identity primary key,
  competition_name  text not null,
  style             text not null,
  image_data        text not null,   -- base64 PNG data URL of the generated poster
  created_at        timestamptz not null default now()
);

-- 2. SEED DATA (safe to skip if you want to start empty) --------

insert into groups (id, name) values
  ('g1','Kanz'), ('g2','Jawhar')
on conflict (id) do nothing;

insert into students (id, group_id, student_code, name) values
  ('s1','g1','K01','Mohammed A'),
  ('s2','g1','K02','Shafi'),
  ('s3','g1','K03','Fathima S'),
  ('s4','g2','J01','Afsal K'),
  ('s5','g2','J02','Ayesha R'),
  ('s6','g2','J03','Zainab M')
on conflict (id) do nothing;

insert into competitions (id, name, category) values
  ('1','Speech Competition','High Zone'),
  ('2','Quran Recitation','High Zone'),
  ('3','Nasheed','Mid Zone'),
  ('4','Islamic Quiz','Zero Zone'),
  ('5','Essay Writing','Ground Zone'),
  ('6','Duff Competition','Mid Zone')
on conflict (id) do nothing;

insert into results (competition_id, first, second, third, published) values
  ('1','[{"groupId":"g1","studentId":"K01"}]','[{"groupId":"g2","studentId":"J01"}]','[{"groupId":"g1","studentId":"K02"}]', true),
  ('2','[{"groupId":"g2","studentId":"J02"}]','[{"groupId":"g1","studentId":"K03"}]','[{"groupId":"g2","studentId":"J03"}]', true)
on conflict (competition_id) do nothing;

-- 3. ROW LEVEL SECURITY ------------------------------------------
-- Everyone (anonymous visitors) can READ. Only a signed-in admin
-- (Supabase Auth user) can INSERT / UPDATE / DELETE.

alter table groups       enable row level security;
alter table students     enable row level security;
alter table competitions enable row level security;
alter table results      enable row level security;
alter table gallery      enable row level security;

-- groups: public read, admin write
create policy "groups_public_read"  on groups for select using (true);
create policy "groups_admin_write"  on groups for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- students: public read, admin write
create policy "students_public_read" on students for select using (true);
create policy "students_admin_write" on students for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- competitions: public read, admin write
create policy "competitions_public_read" on competitions for select using (true);
create policy "competitions_admin_write" on competitions for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- results: the public can only see PUBLISHED results.
-- The signed-in admin can see and edit everything (drafts included).
create policy "results_public_read_published" on results for select
  using (published = true);
create policy "results_admin_read_all" on results for select
  using (auth.role() = 'authenticated');
create policy "results_admin_insert" on results for insert
  with check (auth.role() = 'authenticated');
create policy "results_admin_update" on results for update
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "results_admin_delete" on results for delete
  using (auth.role() = 'authenticated');

-- gallery: public read, admin write
create policy "gallery_public_read"  on gallery for select using (true);
create policy "gallery_admin_write"  on gallery for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- 4. REALTIME ------------------------------------------------------
-- Lets every visitor's browser get pushed updates the instant the
-- admin publishes a result, with no page refresh.
alter publication supabase_realtime add table results;
alter publication supabase_realtime add table competitions;
alter publication supabase_realtime add table gallery;
