create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  company text not null default '',
  phone text not null default '',
  email text not null unique,
  status text not null default 'approved' check (status in ('pending', 'approved', 'rejected')),
  role text not null default 'client' check (role in ('client', 'admin')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

alter table public.profiles enable row level security;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, company, phone, status, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.raw_user_meta_data ->> 'company', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    'approved',
    'client'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and status = 'approved'
  );
$$;

drop policy if exists "Profiles can read own profile or admins can read all" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Admins can update profiles" on public.profiles;
drop policy if exists "Admins can delete rejected profiles" on public.profiles;

create policy "Profiles can read own profile or admins can read all"
on public.profiles
for select
to authenticated
using (auth.uid() = id or public.is_admin());

create policy "Users can insert own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

create policy "Admins can update profiles"
on public.profiles
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can delete rejected profiles"
on public.profiles
for delete
to authenticated
using (public.is_admin() and status = 'rejected' and role = 'client');

-- Depois de criar seu usuário admin pelo Auth, rode algo assim trocando o e-mail:
-- update public.profiles
-- set role = 'admin', status = 'approved'
-- where email = 'admin@empresa.com';
