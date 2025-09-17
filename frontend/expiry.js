function initSearchAndPagination() {
    const searchInput = document.querySelector(".search-div input");
    const searchBtn = document.querySelector(".custom-search");
    const resetBtn = document.querySelector(".custom-reset");

    function searchTable() {
      const searchTerm = searchInput.value.toLowerCase().trim();

      const filtered = allClients.filter((c) => {
        return (
          (c.company_name && c.company_name.toLowerCase().includes(searchTerm)) ||
          (c.industry && c.industry.toLowerCase().includes(searchTerm)) ||
          (c.person_name && c.person_name.toLowerCase().includes(searchTerm)) ||
          (c.email && c.email.toLowerCase().includes(searchTerm))
        );
      });

      renderTable(filtered);
      initActions();
    }

    if (searchBtn) searchBtn.addEventListener("click", searchTable);
    if (searchInput) {
      searchInput.addEventListener("keyup", (e) => {
        if (e.key === "Enter") searchTable();
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        searchInput.value = "";
        renderTable(allClients);
        initActions();
      });
    }

    // Pagination --------------------------
    const pageInput = document.getElementById("pageInput");
    const paginationLinks = document.querySelectorAll(".pagination .page-link");

    let rowsPerPage = 5;
    let currentPageNumber = 1;

    function paginate(page) {
      const rows = Array.from(document.querySelectorAll(".table-data tr"));
      const totalPages = Math.ceil(rows.length / rowsPerPage);

      if (page < 1) page = 1;
      if (page > totalPages) page = totalPages;

      currentPageNumber = page;

      rows.forEach((row, index) => {
        row.style.display =
          index >= (page - 1) * rowsPerPage && index < page * rowsPerPage
            ? ""
            : "none";
      });
    }

    paginate(1);

    if (pageInput) {
      pageInput.addEventListener("change", () => {
        const val = parseInt(pageInput.value, 10);
        if (!isNaN(val) && val > 0) {
          rowsPerPage = val;
          currentPageNumber = 1;
          paginate(currentPageNumber);
        }
      });
    }

    paginationLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const text = link.innerText.toLowerCase();

        if (text === "previous") {
          paginate(currentPageNumber - 1);
        } else if (text === "next") {
          paginate(currentPageNumber + 1);
        } else {
          const pageNum = parseInt(text, 10);
          if (!isNaN(pageNum)) {
            paginate(pageNum);
          }
        }
      });
    });
  }

  // ===================
  // Industry Category Filter
  // ===================
  function initCategoryFilter() {
    const categoryBtn = document.querySelector(".custom-category");
    if (!categoryBtn) return;

    const industries = [...new Set(allClients.map((c) => c.industry).filter(Boolean))];

    let dropdownHtml = `
      <ul class="dropdown-menu show" style="position:absolute; z-index:1000;">
        <li><a class="dropdown-item category-option" data-industry="all">All Industries</a></li>
        ${industries
          .map(
            (ind) =>
              `<li><a class="dropdown-item category-option" data-industry="${ind}">${ind}</a></li>`
          )
          .join("")}
      </ul>
    `;

    let dropdown;
    categoryBtn.addEventListener("click", (e) => {
      e.stopPropagation();

      if (dropdown) {
        dropdown.remove();
        dropdown = null;
      } else {
        categoryBtn.insertAdjacentHTML("afterend", dropdownHtml);
        dropdown = categoryBtn.nextElementSibling;

        dropdown.querySelectorAll(".category-option").forEach((opt) => {
          opt.addEventListener("click", () => {
            const industry = opt.getAttribute("data-industry");

            if (industry === "all") {
              renderTable(allClients);
            } else {
              const filtered = allClients.filter((c) => c.industry === industry);
              renderTable(filtered);
            }
            initActions();
            dropdown.remove();
            dropdown = null;
          });
        });
      }
    });

    document.addEventListener("click", () => {
      if (dropdown) {
        dropdown.remove();
        dropdown = null;
      }
    });
  }

  