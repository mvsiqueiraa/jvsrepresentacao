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

alter table public.profiles enable row level security;

drop policy if exists "Usuários podem ver seu próprio perfil" on public.profiles;
drop policy if exists "Usuários podem atualizar seu próprio perfil" on public.profiles;
drop policy if exists "Admins podem ver todos os perfis" on public.profiles;
drop policy if exists "Admins podem atualizar perfis" on public.profiles;
drop policy if exists "Admins podem deletar perfis" on public.profiles;
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

create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
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
