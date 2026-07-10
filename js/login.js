const loginForm = document.querySelector("[data-login-form]");
const registerForm = document.querySelector("[data-register-form]");
const loginTabs = document.querySelectorAll("[data-login-tab]");
const messageBox = document.querySelector("[data-login-message]");
const passwordToggleButtons = document.querySelectorAll("[data-password-toggle]");
const loginParams = new URLSearchParams(window.location.search);
const loginRedirectTarget = loginParams.get("redirect") || "catalogos.html";
const loginReason = loginParams.get("reason");
const supabaseClient = window.jvsSupabase;

const normalizeEmail = (email) => email.trim().toLowerCase();

const getAuthErrorMessage = (error) => {
  const message = error?.message || "";

  if (message.toLowerCase().includes("email not confirmed")) {
    return "Esse e-mail ainda não foi confirmado no Supabase. Confirme o usuário no painel ou desative a confirmação de e-mail em Authentication.";
  }

  if (message.toLowerCase().includes("invalid login credentials")) {
    return "E-mail ou senha inválidos.";
  }

  return message || "Não foi possível fazer login. Tente novamente.";
};

const showMessage = (text, type = "info") => {
  if (!messageBox) return;

  messageBox.textContent = text;
  messageBox.dataset.type = type;
  messageBox.hidden = false;
};

const showTab = (tabName) => {
  const isRegister = tabName === "register";

  loginForm.hidden = isRegister;
  registerForm.hidden = !isRegister;

  loginTabs.forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.loginTab === tabName);
  });

  if (messageBox) {
    messageBox.hidden = true;
  }
};

const getProfile = async (userId) => {
  const { data, error } = await supabaseClient
    .from("profiles")
    .select("id, name, company, email, status, role")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data;
};

const redirectIfAlreadyLoggedIn = async () => {
  if (!window.jvsSupabaseReady) {
    showMessage("Configure o Supabase em js/supabase-config.js para ativar o acesso.", "warning");
    return;
  }

  const { data } = await supabaseClient.auth.getSession();
  if (data.session) {
    const profile = await getProfile(data.session.user.id);

    if (profile.role === "admin") {
      window.location.href = "admin.html";
      return;
    }

    window.location.href = loginRedirectTarget;
  }
};

loginTabs.forEach((tab) => {
  tab.addEventListener("click", () => showTab(tab.dataset.loginTab));
});

if (loginReason === "pending") {
  showMessage("Seu cadastro ainda está aguardando aprovação do administrador.", "warning");
}

if (loginReason === "rejected") {
  showMessage("Seu cadastro foi recusado. Fale com a equipe comercial para revisar o acesso.", "error");
}

if (loginReason === "profile-error") {
  showMessage("Não foi possível validar seu perfil. Verifique se o cadastro foi aprovado no painel administrativo.", "error");
}

passwordToggleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const input = button.previousElementSibling;
    const isVisible = input.type === "text";
    const label = button.querySelector(".sr-only");

    input.type = isVisible ? "password" : "text";
    button.classList.toggle("is-visible", !isVisible);
    if (label) {
      label.textContent = isVisible ? "Mostrar senha" : "Ocultar senha";
    }
    button.setAttribute("aria-label", isVisible ? "Mostrar senha" : "Ocultar senha");
  });
});

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!window.jvsSupabaseReady) {
    showMessage("Supabase ainda não foi configurado. Preencha URL e anon key no arquivo de configuração.", "error");
    return;
  }

  const formData = new FormData(loginForm);
  const email = normalizeEmail(String(formData.get("email") || ""));
  const password = String(formData.get("password") || "");

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    showMessage(getAuthErrorMessage(error), "error");
    return;
  }

  try {
    const profile = await getProfile(data.user.id);

    if (profile.status === "pending") {
      await supabaseClient.auth.signOut();
      showMessage("Seu cadastro ainda está aguardando aprovação do administrador.", "warning");
      return;
    }

    if (profile.status === "rejected") {
      await supabaseClient.auth.signOut();
      showMessage("Seu cadastro foi recusado. Fale com a equipe comercial para revisar o acesso.", "error");
      return;
    }

    if (profile.role === "admin") {
      window.location.href = "admin.html";
      return;
    }

    window.location.href = loginRedirectTarget;
  } catch (profileError) {
    await supabaseClient.auth.signOut();
    showMessage(`Não foi possível validar seu cadastro. Detalhe: ${profileError.message || "tente novamente em instantes."}`, "error");
  }
});

registerForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!window.jvsSupabaseReady) {
    showMessage("Supabase ainda não foi configurado. Preencha URL e anon key no arquivo de configuração.", "error");
    return;
  }

  const formData = new FormData(registerForm);
  const email = normalizeEmail(String(formData.get("email") || ""));
  const password = String(formData.get("password") || "");
  const passwordConfirm = String(formData.get("passwordConfirm") || "");

  if (password !== passwordConfirm) {
    showMessage("As senhas não conferem. Confira os dois campos antes de enviar.", "error");
    return;
  }

  const { error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: String(formData.get("name") || "").trim(),
        company: String(formData.get("company") || "").trim(),
        phone: String(formData.get("phone") || "").trim(),
      },
    },
  });

  if (error) {
    showMessage(error.message || "Não foi possível solicitar o cadastro.", "error");
    return;
  }

  await supabaseClient.auth.signOut();
  registerForm.reset();
  showTab("login");
  showMessage("Cadastro enviado. Aguarde a aprovação do administrador para acessar os catálogos.", "success");
});

redirectIfAlreadyLoggedIn();
