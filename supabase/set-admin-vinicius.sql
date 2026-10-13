insert into public.profiles (id, email, name, company, phone, role, status, reviewed_at)
select
  id,
  email,
  'Vinicius Siqueira',
  'EmevLabs',
  '',
  'admin',
  'approved',
  now()
from auth.users
where lower(email) = lower('vinicius.siqueira212@gmail.com')
on conflict (id) do update
set email = excluded.email,
    name = excluded.name,
    company = excluded.company,
    role = 'admin',
    status = 'approved',
    reviewed_at = now();

select id, email, role, status
from public.profiles
where lower(email) = lower('vinicius.siqueira212@gmail.com');
