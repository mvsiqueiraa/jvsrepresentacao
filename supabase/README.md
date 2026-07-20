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

## Projeto já criado

Se o banco já estava usando aprovação manual, rode também o arquivo:

```sql
supabase/auto-approve-access.sql
```

Ele faz três coisas:
- novos cadastros passam a nascer como `approved`;
- o trigger `handle_new_user` é atualizado;
- mantém clientes antigos `pending` bloqueados, para não liberar alguém revogado por engano.

Depois disso:
- clientes se cadastram em `login.html`;
- o acesso aos catálogos é liberado automaticamente;
- o admin acessa `admin.html`;
- o admin pode revogar o acesso quando necessário;
- apenas clientes com status `approved` acessam `catalogos.html`.
