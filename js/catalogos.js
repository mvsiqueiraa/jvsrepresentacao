const filterButtons = document.querySelectorAll(".catalog-filter-button");
const catalogItems = document.querySelectorAll(".catalog-item");

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const selectedBrand = button.dataset.filter;

    filterButtons.forEach((item) => {
      item.classList.toggle("is-active", item === button);
    });

    catalogItems.forEach((item) => {
      const shouldShow = selectedBrand === "all" || item.dataset.brand === selectedBrand;
      item.hidden = !shouldShow;
    });
  });
});
