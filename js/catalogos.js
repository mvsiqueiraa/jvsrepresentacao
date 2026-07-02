const filterButtons = document.querySelectorAll(".catalog-filter-button");
const catalogItems = document.querySelectorAll(".catalog-item");

const applyCatalogFilter = (selectedBrand) => {
  const activeFilter = Array.from(filterButtons).find((button) => button.dataset.filter === selectedBrand);
  const normalizedFilter = activeFilter ? selectedBrand : "all";

  filterButtons.forEach((item) => {
    item.classList.toggle("is-active", item.dataset.filter === normalizedFilter);
  });

  catalogItems.forEach((item) => {
    const shouldShow = normalizedFilter === "all" || item.dataset.brand === normalizedFilter;
    item.hidden = !shouldShow;
  });
};

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    applyCatalogFilter(button.dataset.filter);
  });
});

const urlBrand = new URLSearchParams(window.location.search).get("brand");

applyCatalogFilter(urlBrand || "all");
