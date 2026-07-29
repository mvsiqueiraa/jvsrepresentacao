const adminList = document.querySelector("[data-admin-list]");
const clearRejectedButton = document.querySelector("[data-clear-rejected]");
const adminLock = document.querySelector("[data-admin-lock]");
const adminContent = document.querySelector("[data-admin-content]");
const adminLoginForm = document.querySelector("[data-admin-login-form]");
const adminMessage = document.querySelector("[data-admin-message]");
const supabaseClient = window.jvsSupabase;

const statusLabels = {
  pending: "Sem acesso",
  approved: "Aprovado",
  rejected: "Recusado",
};

const escapeHtml = (value) =>
  String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const formatDate = (date) => {
  if (!date) return "Sem data";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
};

const showAdminMessage = (text, type = "error") => {
  adminMessage.textContent = text;
  adminMessage.dataset.type = type;
  adminMessage.hidden = false;
};

const getCurrentAdminProfile = async (userId = "") => {
  let profileUserId = userId;

  if (!profileUserId) {
    const { data: sessionData } = await supabaseClient.auth.getSession();
    profileUserId = sessionData.session?.user.id || "";
  }

  if (!profileUserId) return null;

  const { data: profile, error } = await supabaseClient
    .from("profiles")
    .select("id, email, status, role")
    .eq("id", profileUserId)
    .single();

  if (error) {
    console.warn("Não foi possível validar o perfil administrativo.", error);
    return null;
  }

  return profile;
};

const ensureAdmin = async (userId = "") => {
  if (!window.jvsSupabaseReady) {
    showAdminMessage("Configure o Supabase em js/supabase-config.js para ativar o painel.");
    return false;
  }

  const profile = await getCurrentAdminProfile(userId);

  if (profile?.role === "admin" && profile?.status === "approved") {
    return true;
  }

  await supabaseClient.auth.signOut();

  return false;
};

const showAdminPanel = async () => {
  adminLock.hidden = true;
  adminContent.hidden = false;
  await renderClients();
};

const updateClientStatus = async (id, status) => {
  if (status === "pending" && !window.confirm("Revogar o acesso deste cliente aos catálogos?")) {
    return;
  }

  const { error } = await supabaseClient
    .from("profiles")
    .update({
      status,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    alert("Não foi possível atualizar o cadastro.");
    return;
  }

  await renderClients();
};

const renderClients = async () => {
  const { data: clients, error } = await supabaseClient
    .from("profiles")
    .select("id, name, company, phone, email, status, role, created_at")
    .eq("role", "client")
    .order("created_at", { ascending: false });

  if (error) {
    adminList.innerHTML = `
      <article class="admin-empty">
        <h3>Não foi possível carregar os cadastros</h3>
        <p>Verifique as políticas do Supabase e tente novamente.</p>
      </article>
    `;
    return;
  }

  const sortedClients = [...clients].sort((a, b) => {
    if (a.status === b.status) return new Date(b.created_at) - new Date(a.created_at);
    if (a.status === "approved") return -1;
    if (b.status === "approved") return 1;
    return a.status.localeCompare(b.status);
  });

  if (!sortedClients.length) {
    adminList.innerHTML = `
      <article class="admin-empty">
        <h3>Nenhum cliente cadastrado por enquanto</h3>
        <p>Quando alguém criar acesso à área de catálogos, aparecerá aqui.</p>
      </article>
    `;
    return;
  }

  adminList.innerHTML = sortedClients
    .map(
      (client) => `
        <article class="admin-client-card" data-status="${client.status}">
          <div class="admin-client-main">
            <span class="admin-status">${statusLabels[client.status] || "Sem acesso"}</span>
            <h3>${escapeHtml(client.name)}</h3>
            <p>${escapeHtml(client.company)}</p>
          </div>

          <dl class="admin-client-info">
            <div>
              <dt>Telefone</dt>
              <dd>${escapeHtml(client.phone)}</dd>
            </div>
            <div>
              <dt>E-mail</dt>
              <dd>${escapeHtml(client.email)}</dd>
            </div>
            <div>
              <dt>Solicitado em</dt>
              <dd>${formatDate(client.created_at)}</dd>
            </div>
          </dl>

          <div class="admin-card-actions">
            ${
              client.status === "pending"
                ? `
                  <button type="button" data-action="approved" data-id="${client.id}">Liberar acesso</button>
                `
                : client.status === "approved"
                  ? `
                    <button type="button" data-action="pending" data-id="${client.id}">Revogar acesso</button>
                  `
                  : `<span class="admin-reviewed-label">Revisado</span>`
            }
          </div>
        </article>
      `,
    )
    .join("");
};

adminLoginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!window.jvsSupabaseReady) {
    showAdminMessage("Configure o Supabase em js/supabase-config.js para ativar o painel.");
    return;
  }

  const formData = new FormData(adminLoginForm);
  const email = String(formData.get("adminEmail") || "").trim().toLowerCase();
  const password = String(formData.get("adminPassword") || "");

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    showAdminMessage("E-mail ou senha administrativa incorretos.");
    return;
  }

  if (!(await ensureAdmin(data.user?.id))) {
    showAdminMessage("Este usuário não possui permissão administrativa.");
    return;
  }

  await showAdminPanel();
});

adminList?.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-action]");

  if (!button) return;

  await updateClientStatus(button.dataset.id, button.dataset.action);
});

clearRejectedButton?.addEventListener("click", async () => {
  const { error } = await supabaseClient.from("profiles").delete().eq("status", "rejected").eq("role", "client");

  if (error) {
    alert("Não foi possível limpar os recusados.");
    return;
  }

  await renderClients();
});

(async function initAdmin() {
  if (window.jvsSupabaseReady && (await ensureAdmin())) {
    await showAdminPanel();
  }
})();
