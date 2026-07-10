(async function protectCatalogPage() {
  const currentPage = window.location.pathname.split("/").pop() || "catalogos.html";
  const currentTarget = `${currentPage}${window.location.search}`;
  const buildLoginUrl = (reason = "") =>
    `login.html?redirect=${encodeURIComponent(currentTarget)}${reason ? `&reason=${encodeURIComponent(reason)}` : ""}`;

  if (!window.jvsSupabaseReady) {
    window.location.href = buildLoginUrl("supabase-config");
    return;
  }

  const { data } = await window.jvsSupabase.auth.getSession();

  if (!data.session) {
    window.location.href = buildLoginUrl("no-session");
    return;
  }

  const { data: profile, error } = await window.jvsSupabase
    .from("profiles")
    .select("status")
    .eq("id", data.session.user.id)
    .single();

  if (error || profile?.status !== "approved") {
    await window.jvsSupabase.auth.signOut();
    window.location.href = buildLoginUrl(profile?.status || "profile-error");
  }
})();
