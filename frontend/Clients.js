// ===================
// Sidebar + Table + API Integration for Clients
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

  const tableBody = document.querySelector(".table-data");
  let allClients = [];
  let currentFiltered = [];
  let displayedRows = []; // 👈 For pagination-aware export
  let currentIndustry = "all";
  let dateType = "maintenance"; // 👈 Default filter type

  // ===================
  // Apply Filters (Search + Date + Industry + Date Type)
  // ===================
  function applyFilters() {
    const searchInput = document.querySelector(".search-div input");
    const term = searchInput ? searchInput.value.toLowerCase().trim() : "";
    let filtered = [...allClients];

    // 🔍 Text Search
    if (term) {
      filtered = filtered.filter(
        (c) =>
          (c.company_name && c.company_name.toLowerCase().includes(term)) ||
          (c.person_name && c.person_name.toLowerCase().includes(term)) ||
          (c.email && c.email.toLowerCase().includes(term)) ||
          (c.status && c.status.toLowerCase().includes(term))
      );
    }

    // 📅 Date Filter
    const fromDateInput = document.getElementById("fromDate");
    const toDateInput = document.getElementById("toDate");
    const fromDate = fromDateInput ? fromDateInput.value : "";
    const toDate = toDateInput ? toDateInput.value : "";

    const dateFieldMap = {
      maintenance: { start: "maintenance_start_date", end: "maintenance_end_date" },
      domain: { start: "domain_start_date", end: "domain_end_date" },
      server: { start: "server_start_date", end: "server_end_date" },
    };
    const fields = dateFieldMap[dateType];

    if (fromDate) {
      const fromD = new Date(fromDate);
      filtered = filtered.filter((c) => {
        const value = c[fields.start];
        return value ? new Date(value) >= fromD : false;
      });
    }

    if (toDate) {
      const toD = new Date(toDate + "T23:59:59");
      filtered = filtered.filter((c) => {
        const value = c[fields.end];
        return value ? new Date(value) <= toD : false;
      });
    }

    // 🏭 Industry Filter
    if (currentIndustry !== "all") {
      filtered = filtered.filter((c) => c.industry === currentIndustry);
    }

    currentFiltered = filtered;
    renderTable(filtered);
    initActions();
    paginate(1);
  }

  // ===================
  // Fetch Clients
  // ===================
  async function loadClients() {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/clients/");
      if (!response.ok) throw new Error("Failed to fetch clients");

      allClients = await response.json();
      allClients.sort((a, b) => b.id - a.id);
      currentFiltered = [...allClients];

      initSearchAndPagination();
      initIndustryFilter();
      initDateTypeDropdown();
      applyFilters();
    } catch (err) {
      console.error("Error loading clients:", err);
      tableBody.innerHTML = `<tr><td colspan="9" class="text-center text-danger">Failed to load clients.</td></tr>`;
    }
  }

  // ===================
  // Render Table
  // ===================
  function renderTable(clients) {
    tableBody.innerHTML = "";

    if (clients.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="9" class="text-center">No clients found</td></tr>`;
      return;
    }

    clients.forEach((client, index) => {
      const row = `
        <tr>
          <td>${index + 1}</td>
          <td>${client.company_name || "-"}</td>
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
        </tr>`;
      tableBody.insertAdjacentHTML("beforeend", row);
    });
  }

  // ===================
  // View / Edit / Delete
  // ===================
  function initActions() {
    document.querySelectorAll(".view-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        try {
          const res = await fetch(`http://127.0.0.1:8000/api/clients/${id}/`);
          if (!res.ok) throw new Error("Failed to fetch client details");
          const client = await res.json();

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

    // Edit
    document.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        localStorage.setItem("editClientId", btn.dataset.id);
        window.location.href = "addclient.html";
      });
    });

    // Delete
    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm("Are you sure you want to delete this client?")) return;
        try {
          const res = await fetch(`http://127.0.0.1:8000/api/clients/${btn.dataset.id}/`, { method: "DELETE" });
          if (res.ok) {
            alert("Client deleted successfully!");
            await loadClients();
          } else alert("Failed to delete client.");
        } catch (err) {
          console.error(err);
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

    searchBtn?.addEventListener("click", applyFilters);
    searchInput?.addEventListener("keyup", (e) => e.key === "Enter" && applyFilters());
    resetBtn?.addEventListener("click", () => {
      searchInput.value = "";
      document.getElementById("fromDate").value = "";
      document.getElementById("toDate").value = "";
      currentIndustry = "all";
      dateType = "maintenance";
      document.querySelector(".custom-period").textContent = "Maintenance Period";
      applyFilters();
    });

    // Pagination
    let rowsPerPage = 10;
    let currentPage = 1;

    function paginate(page) {
      const rows = document.querySelectorAll(".table-data tr");
      const totalPages = Math.ceil(rows.length / rowsPerPage);
      if (page < 1) page = 1;
      if (page > totalPages) page = totalPages;
      currentPage = page;

      displayedRows = [];
      rows.forEach((row, i) => {
        const start = (page - 1) * rowsPerPage;
        const end = page * rowsPerPage;
        const visible = i >= start && i < end;
        row.style.display = visible ? "" : "none";
        if (visible) displayedRows.push(currentFiltered[i]);
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

    document.querySelectorAll(".pagination .page-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const txt = link.innerText.toLowerCase();
        if (txt === "previous") paginate(currentPage - 1);
        else if (txt === "next") paginate(currentPage + 1);
        else if (!isNaN(parseInt(txt))) paginate(parseInt(txt));
      });
    });

    window.paginate = paginate;
  }

  // ===================
  // Industry Filter Dropdown
  // ===================
  function initIndustryFilter() {
    const categoryBtn = document.querySelector(".custom-category");
    if (!categoryBtn) return;

    const industries = [...new Set(allClients.map((c) => c.industry).filter(Boolean))];
    categoryBtn.addEventListener("click", (e) => {
      e.stopPropagation();

      const existing = document.querySelector(".dropdown-menu");
      if (existing) {
        existing.remove();
        return;
      }

      const menu = document.createElement("ul");
      menu.className = "dropdown-menu show";
      menu.style.position = "absolute";
      menu.innerHTML = `
        <li><a class="dropdown-item" data-industry="all">All Industries</a></li>
        ${industries.map((i) => `<li><a class="dropdown-item" data-industry="${i}">${i}</a></li>`).join("")}
      `;

      categoryBtn.insertAdjacentElement("afterend", menu);

      menu.querySelectorAll(".dropdown-item").forEach((opt) => {
        opt.addEventListener("click", () => {
          currentIndustry = opt.dataset.industry;
          categoryBtn.textContent = currentIndustry === "all" ? "All Industries" : currentIndustry;
          applyFilters();
          menu.remove();
        });
      });

      document.addEventListener("click", () => menu.remove(), { once: true });
    });
  }

  // ===================
  // Date Type Dropdown (Maintenance / Domain / Server)
  // ===================
  function initDateTypeDropdown() {
    const periodBtn = document.querySelector(".custom-period");
    if (!periodBtn) return;

    periodBtn.addEventListener("click", (e) => {
      e.stopPropagation();

      const existing = document.querySelector(".dropdown-menu.period-menu");
      if (existing) {
        existing.remove();
        return;
      }

      const menu = document.createElement("ul");
      menu.className = "dropdown-menu period-menu show";
      menu.style.position = "absolute";
      menu.innerHTML = `
        <li><a class="dropdown-item" data-type="maintenance">Maintenance Period</a></li>
        <li><a class="dropdown-item" data-type="domain">Domain Period</a></li>
        <li><a class="dropdown-item" data-type="server">Server Period</a></li>
      `;

      periodBtn.insertAdjacentElement("afterend", menu);

      menu.querySelectorAll(".dropdown-item").forEach((opt) => {
        opt.addEventListener("click", () => {
          dateType = opt.dataset.type;
          periodBtn.textContent = opt.textContent;
          applyFilters();
          menu.remove();
        });
      });

      document.addEventListener("click", () => menu.remove(), { once: true });
    });
  }

  // ===================
  // Export Excel (Visible Rows Only)
  // ===================
  const exportBtn = document.getElementById("exportBtn");
  exportBtn?.addEventListener("click", () => {
    if (!displayedRows.length) {
      alert("No clients to export!");
      return;
    }

    const data = displayedRows.map((c) => ({
      "Company Name": c.company_name || "-",
      "Industry": c.industry || "-",
      "Person Name": c.person_name || "-",
      "Contact Number": c.contact_number || "-",
      "Email": c.email || "-",
      "Status": c.status || "-",
      "Maintenance Start": c.maintenance_start_date || "-",
      "Maintenance End": c.maintenance_end_date || "-",
      "Domain Start": c.domain_start_date || "-",
      "Domain End": c.domain_end_date || "-",
      "Server Start": c.server_start_date || "-",
      "Server End": c.server_end_date || "-",
      "Comments": c.comments || "-",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Clients");
    XLSX.writeFile(wb, "Clients_Displayed.xlsx");
  });

  // ===================
  // Add Client
  // ===================
  const addClientBtn = document.querySelector(".custombtn");
  addClientBtn?.addEventListener("click", () => {
    localStorage.removeItem("editClientId");
    window.location.href = "addclient.html";
  });

  await loadClients();
});
