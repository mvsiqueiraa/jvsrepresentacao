(async function setupClientSession() {
  const clientStatus = document.querySelector("[data-client-status]");
  const logoutButton = document.querySelector("[data-client-logout]");

  if (!window.jvsSupabaseReady) return;

  const { data } = await window.jvsSupabase.auth.getSession();

  if (clientStatus && data.session) {
    const { data: profile } = await window.jvsSupabase
      .from("profiles")
      .select("name")
      .eq("id", data.session.user.id)
      .single();

    clientStatus.hidden = false;

    if (profile?.name) {
      const statusLabel = clientStatus.querySelector("span");
      statusLabel.textContent = profile.name.split(" ")[0] || "Logado";
    }
  }

  logoutButton?.addEventListener("click", async () => {
    await window.jvsSupabase.auth.signOut();
    window.location.href = "login.html";
  });
})();
