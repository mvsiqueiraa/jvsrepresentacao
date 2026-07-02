const loginForm = document.querySelector("[data-login-form]");
const loginParams = new URLSearchParams(window.location.search);
const loginRedirectTarget = loginParams.get("redirect") || "catalogos.html";

if (localStorage.getItem("jvsClientLoggedIn") === "true") {
  window.location.href = loginRedirectTarget;
}

loginForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  localStorage.setItem("jvsClientLoggedIn", "true");

  window.location.href = loginRedirectTarget;
});
