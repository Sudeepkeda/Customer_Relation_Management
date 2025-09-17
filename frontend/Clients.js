// ===================
// Sidebar + Table + API Integration
// ===================
document.addEventListener("DOMContentLoaded", async () => {
  // Sidebar Active Menu Highlight
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

  // Sidebar Toggle (Mobile)
  const sidebar = document.getElementById("sidebar");
  const toggleBtn = document.getElementById("sidebarToggle");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      sidebar.classList.toggle("active");
    });
  }

  // Fetch Clients from API
  const tableBody = document.querySelector(".table-data");
  let allClients = []; // keep full list for filtering

  async function loadClients() {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/clients/");
      if (!response.ok) throw new Error("Failed to fetch clients");

      allClients = await response.json();
      renderTable(allClients);

      initActions();
      initSearchAndPagination();
      initCategoryFilter();
    } catch (err) {
      console.error("Error loading clients:", err);
    }
  }

  // Render table rows
  function renderTable(clients) {
    tableBody.innerHTML = "";
    clients.forEach((client, index) => {
      const row = `
        <tr>
          <td>${index + 1}</td>
          <td>${client.company_name}</td>
          <td>${client.industry || "-"}</td>
          <td>${client.person_name || "-"}</td>
          <td>${client.contact_number || "-"}</td>
          <td>${client.email || "-"}</td>
          <td>${client.status || "-"}</td>
          <td>
            <button class="btn btn-sm me-1 view-btn" data-id="${client.id}">
              <img src="images/View.png" alt="View">
            </button>
            <button class="btn btn-sm edit-btn" data-id="${client.id}">
              <img src="images/Edit.png" alt="Edit">
            </button>
          </td>
        </tr>
      `;
      tableBody.insertAdjacentHTML("beforeend", row);
    });
  }

  function initActions() {
    // View button
    document.querySelectorAll(".view-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const clientId = btn.getAttribute("data-id");

        try {
          const res = await fetch(`http://127.0.0.1:8000/api/clients/${clientId}/`);
          if (!res.ok) throw new Error("Failed to fetch client details");
          const client = await res.json();

          let html = `
            <p><strong>Company:</strong> ${client.company_name}</p>
            <p><strong>Industry:</strong> ${client.industry || "-"}</p>
            <p><strong>Person:</strong> ${client.person_name || "-"}</p>
            <p><strong>Contact:</strong> ${client.contact_number || "-"}</p>
            <p><strong>Email:</strong> ${client.email || "-"}</p>
            <p><strong>Website:</strong> ${client.website || "-"}</p>
            <p><strong>Address:</strong> ${client.address || "-"}</p>
            <p><strong>GST:</strong> ${client.gst || "-"}</p>
            <p><strong>AMC:</strong> ${client.amc || "-"}</p>
            <p><strong>AMC Price:</strong> ${client.amc_price || "-"}</p>
            <p><strong>Domain:</strong> ${client.domain_name || "-"}</p>
            <p><strong>Domain Charges:</strong> ${client.domain_charges || "-"}</p>
            <p><strong>Server:</strong> ${client.server_details || "-"}</p>
            <p><strong>Server Price:</strong> ${client.server_price || "-"}</p>
            <p><strong>Maintenance:</strong> ${client.maintenance_value || "-"}</p>
            <p><strong>Comments:</strong> ${client.comments || "-"}</p>
          `;

          document.getElementById("viewClientBody").innerHTML = html;
          new bootstrap.Modal(document.getElementById("viewClientModal")).show();
        } catch (error) {
          console.error(error);
          alert("Failed to load client details.");
        }
      });
    });

    // Edit button
    document.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const clientId = btn.getAttribute("data-id");
        localStorage.setItem("editClientId", clientId);
        window.location.href = "addclient.html";
      });
    });
  }

  // Search + Pagination
  function initSearchAndPagination() {
    const searchInput = document.querySelector(".search-div input");
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

    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        searchInput.value = "";
        renderTable(allClients);
        initActions();
      });
    }

    // Pagination (kept same)
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

  // ✅ Industry Category Filter
  function initCategoryFilter() {
    const categoryBtn = document.querySelector(".custom-category");
    if (!categoryBtn) return;

    // collect unique industries
    const industries = [...new Set(allClients.map(c => c.industry).filter(Boolean))];

    // build dropdown
    let dropdownHtml = `
      <ul class="dropdown-menu show" style="position:absolute; z-index:1000;">
        <li><a class="dropdown-item category-option" data-industry="all">All Industries</a></li>
        ${industries.map(ind => `<li><a class="dropdown-item category-option" data-industry="${ind}">${ind}</a></li>`).join("")}
      </ul>
    `;

    let dropdown;
    categoryBtn.addEventListener("click", (e) => {
      e.stopPropagation();

      // toggle dropdown
      if (dropdown) {
        dropdown.remove();
        dropdown = null;
      } else {
        categoryBtn.insertAdjacentHTML("afterend", dropdownHtml);
        dropdown = categoryBtn.nextElementSibling;

        // handle clicks
        dropdown.querySelectorAll(".category-option").forEach(opt => {
          opt.addEventListener("click", () => {
            const industry = opt.getAttribute("data-industry");

            if (industry === "all") {
              renderTable(allClients);
            } else {
              const filtered = allClients.filter(c => c.industry === industry);
              renderTable(filtered);
            }
            initActions();
            dropdown.remove();
            dropdown = null;
          });
        });
      }
    });

    // close dropdown when clicking outside
    document.addEventListener("click", () => {
      if (dropdown) {
        dropdown.remove();
        dropdown = null;
      }
    });
  }

  // ✅ Add Client Button → must clear editClientId
  const addClientBtn = document.querySelector(".custombtn");
  if (addClientBtn) {
    addClientBtn.addEventListener("click", () => {
      localStorage.removeItem("editClientId");
      window.location.href = "addclient.html";
    });
  }

  await loadClients();
});
