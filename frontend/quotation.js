// ===================
// Sidebar + Table + API Integration
// ===================
document.addEventListener("DOMContentLoaded", async () => {
  // ===================
  // Sidebar Active Menu Highlight
  // ===================
  const currentPage = window.location.pathname.split("/").pop().toLowerCase();
  const navLinks = document.querySelectorAll(".nav-list .nav-link");
  navLinks.forEach((link) => {
    const linkPage = link.getAttribute("href").toLowerCase();
    if (linkPage === currentPage) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });

  // ===================
  // Sidebar Toggle (Mobile)
  // ===================
  const sidebar = document.getElementById("sidebar");
  const toggleBtn = document.getElementById("sidebarToggle");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      sidebar.classList.toggle("active");
    });
  }

  // ===================
  // Fetch Quotations from API
  // ===================
  const tableBody = document.querySelector(".table-data");

  async function loadQuotations() {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/quotations/");
      if (!response.ok) throw new Error("Failed to fetch quotations");

      const quotations = await response.json();
      tableBody.innerHTML = "";

      quotations.forEach((quotation, index) => {
        const row = `
          <tr>
            <td>${index + 1}</td>
            <td>${quotation.quotation_date || "-"}</td>
            <td>${quotation.quotation_number || "-"}</td>
            <td>${quotation.company_name || "-"}</td>
            <td>${quotation.description || "-"}</td>
            <td>${quotation.services?.find(s => s.type === "pricing")?.price || "-"}</td>
            <td>
              <button class="btn btn-sm me-1"><img src="images/View.png" alt="View"></button>
              <button class="btn btn-sm"><img src="images/Edit.png" alt="Edit"></button>
            </td>
          </tr>
        `;
        tableBody.insertAdjacentHTML("beforeend", row);
      });

      initSearchAndPagination();
    } catch (err) {
      console.error("Error loading quotations:", err);
    }
  }

  await loadQuotations();

  // ===================
  // Search + Reset + Category Filter
  // ===================
  function initSearchAndPagination() {
    const searchInput = document.querySelector(".search-div input");
    const categoryBtn = document.querySelector(".custom-category");
    const searchBtn = document.querySelector(".custom-search");
    const resetBtn = document.querySelector(".custom-reset");
    const tableRows = document.querySelectorAll(".table-data tr");

    function searchTable() {
      const searchTerm = searchInput.value.toLowerCase();
      tableRows.forEach((row) => {
        const rowText = row.innerText.toLowerCase();
        row.style.display = rowText.includes(searchTerm) ? "" : "none";
      });
    }

    if (searchBtn) searchBtn.addEventListener("click", searchTable);

    if (searchInput) {
      searchInput.addEventListener("keyup", (e) => {
        if (e.key === "Enter") searchTable();
      });
    }

    if (categoryBtn) {
      categoryBtn.addEventListener("click", () => {
        alert("Category filter clicked (expand to filter by industry/company).");
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        searchInput.value = "";
        tableRows.forEach((row) => (row.style.display = ""));
      });
    }

    // ===================
    // Pagination
    // ===================
    const pageInput = document.getElementById("pageInput");
    const paginationLinks = document.querySelectorAll(".pagination .page-link");
    const rowsPerPage = 5;
    let currentPageNumber = 1;

    function paginate(page) {
      const rows = Array.from(tableRows);
      const totalPages = Math.ceil(rows.length / rowsPerPage);

      if (page < 1) page = 1;
      if (page > totalPages) page = totalPages;

      currentPageNumber = page;
      if (pageInput) pageInput.value = currentPageNumber;

      rows.forEach((row, index) => {
        row.style.display =
          index >= (page - 1) * rowsPerPage && index < page * rowsPerPage ? "" : "none";
      });
    }

    paginate(1);

    if (pageInput) {
      pageInput.addEventListener("change", () => {
        paginate(parseInt(pageInput.value, 10));
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
          paginate(parseInt(text, 10));
        }
      });
    });
  }

  // ===================
  // Add quotation Button
  // ===================
  const addQuotationBtn = document.querySelector(".custombtn");
  if (addQuotationBtn) {
    addQuotationBtn.addEventListener("click", () => {
      window.location.href = "addquotation.html";
    });
  }
});
