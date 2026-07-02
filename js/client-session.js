const clientStatus = document.querySelector("[data-client-status]");
const logoutButton = document.querySelector("[data-client-logout]");
const clientLoggedIn = localStorage.getItem("jvsClientLoggedIn") === "true";

if (clientStatus && clientLoggedIn) {
  clientStatus.hidden = false;
}

logoutButton?.addEventListener("click", () => {
  localStorage.removeItem("jvsClientLoggedIn");
  window.location.href = "login.html";
});
