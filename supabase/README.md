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

Para usar os catálogos vindos do banco, rode também:

```sql
supabase/catalogs.sql
```

Ele cria a tabela `catalogs`, configura as políticas de acesso e cadastra os catálogos atuais sem duplicar registros se for executado novamente.

Depois disso:
- clientes se cadastram em `login.html`;
- o acesso aos catálogos é liberado automaticamente;
- o admin acessa `admin.html`;
- o admin pode revogar o acesso quando necessário;
- apenas clientes com status `approved` acessam `catalogos.html`.

## Notificação de novo cadastro

Existe uma Edge Function em:

```text
supabase/functions/notify-new-client
```

Ela é chamada depois que o cliente cria o cadastro e pode enviar aviso por e-mail e WhatsApp.

Secrets usados pela função:

```text
RESEND_API_KEY
RESEND_FROM
NOTIFY_EMAIL_TO
WHATSAPP_ACCESS_TOKEN
WHATSAPP_PHONE_NUMBER_ID
WHATSAPP_TO
WHATSAPP_GRAPH_VERSION
```

Para usar apenas e-mail, configure `RESEND_API_KEY`, `RESEND_FROM` e `NOTIFY_EMAIL_TO`.

Para WhatsApp, configure também `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` e `WHATSAPP_TO`.
`WHATSAPP_GRAPH_VERSION` é opcional; se não for configurado, a função usa `v25.0`.

Observação: no WhatsApp Cloud API, mensagens de produção podem exigir configuração correta do WhatsApp Business e, em alguns casos, modelo aprovado pela Meta.
