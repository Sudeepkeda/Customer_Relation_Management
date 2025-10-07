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

      // ✅ Sort so latest (highest id) comes first
      allClients.sort((a, b) => b.id - a.id);

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
          <div class="d-flex flex-nowrap">
            <button class="btn btn-sm me-1 view-btn" data-id="${client.id}">
              <img src="images/View.png" alt="View">
            </button>
            <button class="btn btn-sm me-1 edit-btn" data-id="${client.id}">
              <img src="images/Edit.png" alt="Edit">
            </button>
            <button class="btn btn-sm delete-btn" data-id="${client.id}">
              <img src="images/Delete.png" alt="Delete">
            </button>
          </div>
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

          // ✅ Show all fields
          let html = `
  <div class="container-fluid">
    <div class="row g-3">
      <div class="col-md-4"><strong>Company:</strong> ${client.company_name}</div>
      <div class="col-md-4"><strong>Industry:</strong> ${client.industry || "-"}</div>
      <div class="col-md-4"><strong>Person:</strong> ${client.person_name || "-"}</div>
      <div class="col-md-4"><strong>Contact:</strong> ${client.contact_number || "-"}</div>
      <div class="col-md-4"><strong>Email:</strong> ${client.email || "-"}</div>
      <div class="col-md-4"><strong>Website:</strong> ${client.website || "-"}</div>
      <div class="col-md-4"><strong>Address:</strong> ${client.address || "-"}</div>
      <div class="col-md-4"><strong>GST:</strong> ${client.gst || "-"}</div>
      <div class="col-md-4"><strong>AMC:</strong> ${client.amc || "-"}</div>
      <div class="col-md-4"><strong>AMC Price:</strong> ${client.amc_price || "-"}</div>
      <div class="col-md-4"><strong>Domain:</strong> ${client.domain_name || "-"}</div>
      <div class="col-md-4"><strong>Domain Charges:</strong> ${client.domain_charges || "-"}</div>
      <div class="col-md-4"><strong>Domain Start Date:</strong> ${client.domain_start_date || "-"}</div>
      <div class="col-md-4"><strong>Domain End Date:</strong> ${client.domain_end_date || "-"}</div>
      <div class="col-md-4"><strong>Server Details:</strong> ${client.server_details || "-"}</div>
      <div class="col-md-4"><strong>Server Price:</strong> ${client.server_price || "-"}</div>
      <div class="col-md-4"><strong>Server Start Date:</strong> ${client.server_start_date || "-"}</div>
      <div class="col-md-4"><strong>Server End Date:</strong> ${client.server_end_date || "-"}</div>
      <div class="col-md-4"><strong>Maintenance Value:</strong> ${client.maintenance_value || "-"}</div>
      <div class="col-md-4"><strong>Maintenance Start Date:</strong> ${client.maintenance_start_date || "-"}</div>
      <div class="col-md-4"><strong>Maintenance End Date:</strong> ${client.maintenance_end_date || "-"}</div>
      <div class="col-md-4"><strong>Comments:</strong> ${client.comments || "-"}</div>
      <div class="col-md-4"><strong>Priority:</strong> ${client.priority || "-"}</div>
      <div class="col-md-4"><strong>Status:</strong> ${client.status || "-"}</div>
    </div>
  </div>
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
  

   // Delete button
    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const clientId = btn.getAttribute("data-id");

        if (!confirm("Are you sure you want to delete this client?")) return;

        try {
          const res = await fetch(`http://127.0.0.1:8000/api/clients/${clientId}/`, {
            method: "DELETE",
          });

          if (res.ok) {
            alert("Client deleted successfully!");
            await loadClients(); // refresh table
          } else {
            alert("Failed to delete client.");
          }
        } catch (error) {
          console.error("Delete error:", error);
          alert("Something went wrong while deleting.");
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
      const term = searchInput.value.toLowerCase().trim();
      const filtered = allClients.filter(c =>
      (c.company_name && c.company_name.toLowerCase().includes(term)) ||
      (c.person_name && c.person_name.toLowerCase().includes(term)) ||
      (c.email && c.email.toLowerCase().includes(term)) ||
      (c.status && c.status.toLowerCase().includes(term))
      );

      renderTable(filtered);
      initActions();
      paginate(1);
    }

    searchBtn?.addEventListener("click", searchTable);
    searchInput?.addEventListener("keyup", (e) => { if (e.key === "Enter") searchTable(); });
    resetBtn?.addEventListener("click", () => { searchInput.value = ""; renderTable(allClients); initActions(); paginate(1); });

    // Pagination
    let rowsPerPage = 10;
    let currentPage = 1;

    function paginate(page) {
      const rows = document.querySelectorAll(".table-data tr");
      const totalPages = Math.ceil(rows.length / rowsPerPage);
      if (page < 1) page = 1;
      if (page > totalPages) page = totalPages;
      currentPage = page;

      rows.forEach((row, i) => {
        const start = (page - 1) * rowsPerPage;
        const end = page * rowsPerPage;
        row.style.display = i >= start && i < end ? "" : "none";
      });
    }

    const pageInput = document.getElementById("pageInput");
    pageInput?.addEventListener("input", () => {
      const val = parseInt(pageInput.value, 10);
      if (!isNaN(val) && val > 0) {
        rowsPerPage = val;
        paginate(1);
      }
    });

    document.querySelectorAll(".pagination .page-link").forEach(link => {
      link.addEventListener("click", e => {
        e.preventDefault();
        const txt = link.innerText.toLowerCase();
        if (txt === "previous") paginate(currentPage - 1);
        else if (txt === "next") paginate(currentPage + 1);
        else if (!isNaN(parseInt(txt))) paginate(parseInt(txt));
      });
    });

    // Expose paginate for other functions
    window.paginate = paginate;
  }

  // ✅ Industry Category Filter
  function initCategoryFilter() {
    const categoryBtn = document.querySelector(".custom-category");
    if (!categoryBtn) return;

    // collect unique industries
    const industries = [...new Set(allClients.map((c) => c.industry).filter(Boolean))];

    // build dropdown
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

      // toggle dropdown
      if (dropdown) {
        dropdown.remove();
        dropdown = null;
      } else {
        categoryBtn.insertAdjacentHTML("afterend", dropdownHtml);
        dropdown = categoryBtn.nextElementSibling;

        // handle clicks
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
