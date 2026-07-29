const filterButtons = document.querySelectorAll(".catalog-filter-button");
const catalogGrid = document.getElementById("catalog-grid");
const loadingIndicator = document.getElementById("catalog-loading");
const errorIndicator = document.getElementById("catalog-error");
const supabaseClient = window.jvsSupabase;

let catalogData = [];

const renderCatalogs = (brandFilter = "all") => {
  // Remover os itens existentes antes de renderizar
  catalogGrid.querySelectorAll(".catalog-item").forEach(el => el.remove());

  const filtered = brandFilter === "all" ? catalogData : catalogData.filter(c => c.brand === brandFilter);

  filtered.forEach(catalog => {
    const article = document.createElement("article");
    article.className = "catalog-item";
    article.dataset.brand = catalog.brand;

    const brandCapitalized = catalog.brand.charAt(0).toUpperCase() + catalog.brand.slice(1);

    article.innerHTML = `
      <span class="catalog-brand">${brandCapitalized}</span>
      <div class="catalog-logo">
        <img src="${catalog.logo_src}" alt="${brandCapitalized}" />
      </div>
      <h2>${catalog.title}</h2>
      <a href="${catalog.url}" target="_blank" rel="noopener">Abrir catálogo</a>
    `;
    catalogGrid.appendChild(article);
  });
};

const applyCatalogFilter = (selectedBrand) => {
  const activeFilter = Array.from(filterButtons).find((button) => button.dataset.filter === selectedBrand);
  const normalizedFilter = activeFilter ? selectedBrand : "all";

  filterButtons.forEach((item) => {
    item.classList.toggle("is-active", item.dataset.filter === normalizedFilter);
  });

  renderCatalogs(normalizedFilter);
};

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    applyCatalogFilter(button.dataset.filter);
  });
});

const loadCatalogs = async () => {
  if (!supabaseClient) {
    loadingIndicator.hidden = true;
    errorIndicator.textContent = "Erro: Supabase não configurado.";
    errorIndicator.hidden = false;
    return;
  }

  // Tenta buscar os catálogos (RLS garantirá que apenas aprovados tenham acesso)
  const { data, error } = await supabaseClient
    .from("catalogs")
    .select("*")
    .order("created_at", { ascending: true });

  loadingIndicator.hidden = true;

  if (error) {
    console.error("Erro ao buscar catálogos:", error);
    errorIndicator.hidden = false;
    return;
  }

  if (!data || data.length === 0) {
    errorIndicator.textContent = "Nenhum catálogo disponível no momento.";
    errorIndicator.hidden = false;
    return;
  }

  catalogData = data;
  
  const urlBrand = new URLSearchParams(window.location.search).get("brand");
  applyCatalogFilter(urlBrand || "all");
};

document.addEventListener("DOMContentLoaded", () => {
  loadCatalogs();
});
