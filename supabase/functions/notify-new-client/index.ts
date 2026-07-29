const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type ClientPayload = {
  name?: string;
  company?: string;
  phone?: string;
  email?: string;
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });

const clean = (value?: string) => String(value || "").trim();

const buildMessage = (client: Required<ClientPayload>) =>
  [
    "Novo cadastro na área de catálogos da J V S Representações:",
    "",
    `Nome: ${client.name}`,
    `Empresa: ${client.company}`,
    `Telefone: ${client.phone}`,
    `E-mail: ${client.email}`,
    "",
    "O acesso foi liberado automaticamente. Você pode revogar pelo painel administrativo.",
  ].join("\n");

const sendEmailNotification = async (client: Required<ClientPayload>, message: string) => {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const to = Deno.env.get("NOTIFY_EMAIL_TO");
  const from = Deno.env.get("RESEND_FROM") || "J V S Representações <onboarding@resend.dev>";

  if (!apiKey || !to) {
    return { skipped: true, reason: "E-mail não configurado" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `Novo cadastro nos catálogos: ${client.name}`,
      text: message,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 30px; border-radius: 8px; border: 1px solid #e5e7eb;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #0f2a44; margin: 0; font-size: 24px;">Novo Cliente Cadastrado! 🎉</h1>
            <p style="color: #6b7280; margin-top: 8px; font-size: 14px;">Você tem um novo acesso liberado na área de catálogos da J V S Representações.</p>
          </div>
          
          <div style="background-color: #ffffff; padding: 24px; border-radius: 6px; border: 1px solid #e5e7eb; margin-bottom: 24px;">
            <h3 style="margin-top: 0; color: #111827; font-size: 16px; border-bottom: 1px solid #f3f4f6; padding-bottom: 12px;">Dados do Cliente</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; width: 100px;"><strong>Nome:</strong></td>
                <td style="padding: 8px 0; color: #111827;">${client.name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;"><strong>Empresa:</strong></td>
                <td style="padding: 8px 0; color: #111827;">${client.company}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;"><strong>Telefone:</strong></td>
                <td style="padding: 8px 0; color: #111827;">
                  <a href="https://wa.me/55${client.phone.replace(/\D/g, '')}" style="color: #2563eb; text-decoration: none;">${client.phone}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;"><strong>E-mail:</strong></td>
                <td style="padding: 8px 0; color: #111827;">
                  <a href="mailto:${client.email}" style="color: #2563eb; text-decoration: none;">${client.email}</a>
                </td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; font-size: 13px; color: #6b7280;">
            <p style="margin: 0;">O acesso deste cliente foi liberado automaticamente.</p>
            <p style="margin: 4px 0 0;">Se precisar bloquear, acesse o <a href="https://SEU_SITE/admin.html" style="color: #2563eb;">painel administrativo</a>.</p>
          </div>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    return {
      skipped: false,
      error: await response.text(),
    };
  }

  return { skipped: false, ok: true };
};

const sendWhatsAppNotification = async (message: string) => {
  const token = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
  const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
  const to = Deno.env.get("WHATSAPP_TO");
  const graphVersion = Deno.env.get("WHATSAPP_GRAPH_VERSION") || "v25.0";

  if (!token || !phoneNumberId || !to) {
    return { skipped: true, reason: "WhatsApp não configurado" };
  }

  const response = await fetch(`https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: {
        preview_url: false,
        body: message,
      },
    }),
  });

  if (!response.ok) {
    return {
      skipped: false,
      error: await response.text(),
    };
  }

  return { skipped: false, ok: true };
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Método não permitido" }, 405);
  }

  try {
    const payload = (await request.json()) as ClientPayload;
    const client = {
      name: clean(payload.name) || "Não informado",
      company: clean(payload.company) || "Não informado",
      phone: clean(payload.phone) || "Não informado",
      email: clean(payload.email) || "Não informado",
    };

    const message = buildMessage(client);
    const [email, whatsapp] = await Promise.all([
      sendEmailNotification(client, message),
      sendWhatsAppNotification(message),
    ]);

    return jsonResponse({ ok: true, email, whatsapp });
  } catch (error) {
    return jsonResponse({ ok: false, error: error instanceof Error ? error.message : "Erro inesperado" }, 500);
  }
});
