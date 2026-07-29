create table if not exists public.catalogs (
  id uuid primary key default gen_random_uuid(),
  brand text not null,
  title text not null,
  url text not null,
  logo_src text,
  created_at timestamptz not null default now(),
  unique (brand, title, url)
);

alter table public.catalogs enable row level security;

drop policy if exists "Approved users can read catalogs" on public.catalogs;
drop policy if exists "Admins can insert catalogs" on public.catalogs;
drop policy if exists "Admins can update catalogs" on public.catalogs;
drop policy if exists "Admins can delete catalogs" on public.catalogs;

create policy "Approved users can read catalogs"
on public.catalogs
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and (p.status = 'approved' or p.role = 'admin')
  )
);

create policy "Admins can insert catalogs"
on public.catalogs
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

create policy "Admins can update catalogs"
on public.catalogs
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

create policy "Admins can delete catalogs"
on public.catalogs
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

insert into public.catalogs (brand, title, url, logo_src) values
  ('krona', 'Catálogo de produtos: Tubos e Conexões', 'https://drive.google.com/file/d/1MToVAfvnY14avwr6Gyf1FMV9z6dmnk_f/view?usp=drive_link', 'assets/logo-krona.svg'),
  ('soprano', 'Catálogo de produtos: Utilidades Térmicas', 'https://drive.google.com/file/d/1PZhDxpzeDkbTcJ03P4wiAJj9Qav7bbBt/view?usp=sharing', 'assets/logo-soprano.svg'),
  ('soprano', 'Catálogo de produtos: Interruptores e Tomadas', 'https://drive.google.com/file/d/1b02PIVx-B59eIG3q8hnKq7otSPQwI_0l/view?usp=sharing', 'assets/logo-soprano.svg'),
  ('soprano', 'Catálogo de produtos: Materiais Elétricos', 'https://drive.google.com/file/d/1gCEgQTMy3VONP3VbrmtLr4pvO4xPgqbQ/view?usp=sharing', 'assets/logo-soprano.svg'),
  ('soprano', 'Catálogo de produtos: Fechaduras, Ferragens e Cadeados', 'https://drive.google.com/file/d/1gCEgQTMy3VONP3VbrmtLr4pvO4xPgqbQ/view?usp=sharing', 'assets/logo-soprano.svg'),
  ('iberica', 'Catálogo de produtos: Condutores Elétricos', 'https://drive.google.com/file/d/1ruMqrIpPKTzLDi7COArSujuhVA80rRdJ/view?usp=sharing', 'assets/logo-iberica.svg'),
  ('ciser', 'Catálogo de produtos', 'https://drive.google.com/file/d/1by8Hwg7wGg8W778T-irYZhcKmIRmP6HW/view?usp=sharing', 'assets/logo-ciser.svg'),
  ('vonder', 'Catálogo de produtos', 'https://www.ovd.com.br/_CATALOGO/vonder/web/', 'assets/logo-vonder.svg'),
  ('viqua', 'Catálogo de produtos: Residencial, Predial e Jardim', 'https://drive.google.com/file/d/1ltILg4NwFfD2pMuoa3rvTMd_7NEH9JRH/view?usp=sharing', 'assets/logo-viqua.svg'),
  ('aeroflex', 'Catálogo Técnico Industrial', 'https://drive.google.com/file/d/1y7oe3acf1L3Wq2oP2DoHWR2DJ5hFHq0w/view?usp=sharing', 'assets/logo-aeroflex.svg'),
  ('aeroflex', 'Catálogo Alimentar', 'https://drive.google.com/file/d/10xYYKtHrrOXIvXk5Vho29lDEd-BuMeBW/view?usp=sharing', 'assets/logo-aeroflex.svg'),
  ('elleve', 'Catálogo: Escoamento Inteligente', 'https://drive.google.com/file/d/1dIFolQQjMMPhucGD8rouxDL62WKASPch/view?usp=sharing', 'assets/logo-elleve.png'),
  ('novii', 'Catálogo Novii', 'https://drive.google.com/file/d/1gzjYWXMUNt-Ffv9eovAg-MiUPAbK9acL/view?usp=sharing', 'assets/logo-novii.png'),
  ('topmax', 'Catálogo: Ralos Modulares', 'https://drive.google.com/file/d/1dIFolQQjMMPhucGD8rouxDL62WKASPch/view?usp=sharing', 'assets/logo-topmax.png')
on conflict (brand, title, url) do update
set logo_src = excluded.logo_src;
