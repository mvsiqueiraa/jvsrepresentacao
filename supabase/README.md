# Configuração Supabase - J V S Representações

1. Crie um projeto no Supabase.
2. Abra o SQL Editor e rode o arquivo `schema.sql`.
3. Em Authentication, crie o usuário administrador com e-mail e senha.
4. Depois de criar o admin, rode no SQL Editor:

```sql
update public.profiles
set role = 'admin', status = 'approved'
where email = 'admin@empresa.com';
```

5. No projeto, copie:
   - Project URL
   - anon public key

6. Cole esses valores em `js/supabase-config.js`.

Depois disso:
- clientes se cadastram em `login.html`;
- cadastros entram como `pending`;
- admin acessa `admin.html`;
- admin aprova ou recusa;
- apenas clientes `approved` acessam `catalogos.html`.
