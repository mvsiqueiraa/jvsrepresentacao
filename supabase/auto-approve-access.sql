alter table public.profiles
alter column status set default 'approved';

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

-- Opcional: use apenas se quiser liberar clientes antigos que ainda estavam pendentes.
-- Não rode este bloco se algum cliente "pending" já foi revogado de propósito.
--
-- update public.profiles
-- set status = 'approved',
--     reviewed_at = coalesce(reviewed_at, now())
-- where role = 'client'
--   and status = 'pending';
