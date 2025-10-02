// ===================
// Sidebar + Table + API Integration
// ===================
document.addEventListener("DOMContentLoaded", async () => {
  // Sidebar Active Menu Highlight
  const currentPage = window.location.pathname.split("/").pop().toLowerCase();
  const navLinks = document.querySelectorAll(".nav-list .nav-link");
  navLinks.forEach((link) => {
    const linkPage = link.getAttribute("href").toLowerCase();
    link.classList.toggle("active", linkPage === currentPage);
  });

  // Sidebar Toggle (Mobile)
  const sidebar = document.getElementById("sidebar");
  const toggleBtn = document.getElementById("sidebarToggle");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      sidebar.classList.toggle("active");
    });
  }

  // ===================
  // Table Rendering
  // ===================
  const tableBody = document.querySelector(".table-data");
  let allQuotations = [];

  function renderTable(quotations) {
    tableBody.innerHTML = "";

    quotations.forEach((quotation, index) => {
      const row = `
        <tr>
          <td>${index + 1}</td>
          <td>${quotation.quotation_date || "-"}</td>
          <td>${quotation.quotation_number || "-"}</td>
          <td>${quotation.company_name || "-"}</td>
          <td>${quotation.description || "-"}</td>
          <td>₹${quotation.price ? Number(quotation.price).toFixed(2) : "0.00"}</td>
          <td>
            <button class="btn btn-sm me-1 btn-view" data-id="${quotation.id}">
              <img src="images/View.png" alt="View">
            </button>
            <button class="btn btn-sm btn-edit" data-id="${quotation.id}">
              <img src="images/Edit.png" alt="Edit">
            </button>
            <button class="btn btn-sm btn-send" data-id="${quotation.id}">
              <img src="images/send.png" alt="Send">
            </button>
          </td>
        </tr>
      `;
      tableBody.insertAdjacentHTML("beforeend", row);
    });

    initActions();
  }

  // ===================
  // Load Quotations
  // ===================
  async function loadQuotations() {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/quotations/");
      if (!response.ok) throw new Error("Failed to fetch quotations");

      allQuotations = await response.json();

      // sort newest first
      allQuotations.sort((a, b) => b.id - a.id);

      renderTable(allQuotations);
      initSearchAndPagination();
      initCategoryFilter();
    } catch (err) {
      console.error("Error loading quotations:", err);
    }
  }

  // ===================
  // Actions
  // ===================
  function initActions() {
    // View
    document.querySelectorAll(".btn-view").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-id");
        try {
          const res = await fetch(`http://127.0.0.1:8000/api/quotations/${id}/`);
          if (!res.ok) throw new Error("Failed to fetch details");
          const q = await res.json();

          document.getElementById("viewModalBody").innerHTML = `
            <p><strong>Quotation Number:</strong> ${q.quotation_number || "-"}</p>
            <p><strong>Date:</strong> ${q.quotation_date || "-"}</p>
            <p><strong>Company Name:</strong> ${q.company_name || "-"}</p>
            <p><strong>Industry:</strong> ${q.industry || "-"}</p>
            <p><strong>Person Name:</strong> ${q.person_name || "-"}</p>
            <p><strong>Contact:</strong> ${q.contact || "-"}</p>
            <p><strong>Email:</strong> ${q.email || "-"}</p>
            <p><strong>Website:</strong> ${q.website || "-"}</p>
            <p><strong>Address:</strong> ${q.address || "-"}</p>
            <p><strong>Description:</strong> ${q.description || "-"}</p>
            <p><strong>Price:</strong> ₹${q.price ? Number(q.price).toFixed(2) : "0.00"}</p>
            <p><strong>Services:</strong></p>
            <ul>
              ${(q.services || []).map((s) => `<li><strong>${s.type}</strong>: ${s.content}</li>`).join("")}
            </ul>
          `;

          new bootstrap.Modal(document.getElementById("viewModal")).show();
        } catch (err) {
          console.error("View failed:", err);
        }
      });
    });

    // Edit
    document.querySelectorAll(".btn-edit").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        window.location.href = `addquotation.html?id=${id}`;
      });
    });

    // Send
    document.querySelectorAll(".btn-send").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-id");
        try {
          const res = await fetch(`http://127.0.0.1:8000/api/send-quotation-mail/${id}/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" }
          });

          if (!res.ok) throw new Error("Failed to send quotation email");

          const data = await res.json();
          alert(`✅ Quotation email sent to ${data.email}`);
        } catch (err) {
          console.error("Send failed:", err);
          alert("❌ Failed to send quotation email. Check backend logs.");
        }
      });
    });
  }

  // ===================
  // Search + Pagination
  // ===================
  function initSearchAndPagination() {
    const searchInput = document.querySelector(".search-div input");
    const searchBtn = document.querySelector(".custom-search");
    const resetBtn = document.querySelector(".custom-reset");

    function searchTable() {
      const searchTerm = searchInput.value.toLowerCase().trim();

      const filtered = allQuotations.filter((q) => {
        return (
          (q.quotation_number && q.quotation_number.toLowerCase().includes(searchTerm)) ||
          (q.company_name && q.company_name.toLowerCase().includes(searchTerm)) ||
          (q.description && q.description.toLowerCase().includes(searchTerm)) ||
          (q.person_name && q.person_name.toLowerCase().includes(searchTerm))
        );
      });

      renderTable(filtered);
      paginate(1);
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
        renderTable(allQuotations);
        paginate(1);
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
          index >= (page - 1) * rowsPerPage && index < page * rowsPerPage ? "" : "none";
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

    // make paginate available to search/reset
    window.paginate = paginate;
  }

  // ===================
  // Category Filter (by Company Name)
  // ===================
  function initCategoryFilter() {
    const categoryBtn = document.querySelector(".custom-category");
    if (!categoryBtn) return;

    const companies = [...new Set(allQuotations.map((q) => q.company_name).filter(Boolean))];

    let dropdownHtml = `
      <ul class="dropdown-menu show" style="position:absolute; z-index:1000;">
        <li><a class="dropdown-item category-option" data-company="all">All Companies</a></li>
        ${companies
          .map(
            (c) =>
              `<li><a class="dropdown-item category-option" data-company="${c}">${c}</a></li>`
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
            const company = opt.getAttribute("data-company");

            if (company === "all") {
              renderTable(allQuotations);
            } else {
              const filtered = allQuotations.filter((q) => q.company_name === company);
              renderTable(filtered);
            }
            paginate(1);
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

  // ===================
  // Init Load
  // ===================
  await loadQuotations();
});
