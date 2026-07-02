const isClientLoggedIn = localStorage.getItem("jvsClientLoggedIn") === "true";

if (!isClientLoggedIn) {
  const currentPage = window.location.pathname.split("/").pop() || "catalogos.html";
  const currentTarget = `${currentPage}${window.location.search}`;

  window.location.href = `login.html?redirect=${encodeURIComponent(currentTarget)}`;
}
