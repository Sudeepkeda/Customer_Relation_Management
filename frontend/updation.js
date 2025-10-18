// ===================
// Updation Page Script
// ===================
document.addEventListener("DOMContentLoaded", async () => {

  // Sidebar Highlight
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
  let allUpdations = [];      // full list from API
  let currentFiltered = [];   // after filters
  let currentStatus = "all";  // current selected status
  let rowsPerPage = 10;
  let currentPageNum = 1;

  // ===================
  // Fetch & Initialize
  // ===================
  async function loadUpdations() {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/updations/");
      if (!res.ok) throw new Error("Failed to fetch updations");
      allUpdations = await res.json();
      currentFiltered = [...allUpdations];
      initSearchAndPagination();
      initStatusFilter();
      applyFilters();
    } catch (err) {
      console.error("Error loading updations:", err);
      tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Failed to load updations</td></tr>`;
    }
  }

  // ===================
  // Apply All Filters
  // ===================
  function applyFilters() {
    const searchInput = document.querySelector(".search-div input");
    const fromDateInput = document.getElementById("fromDate");
    const toDateInput = document.getElementById("toDate");

    const term = searchInput?.value.toLowerCase().trim() || "";
    const fromDate = fromDateInput?.value || "";
    const toDate = toDateInput?.value || "";

    let filtered = [...allUpdations];

    // Search term filter
    if (term) {
      filtered = filtered.filter(u =>
        (u.client_name && u.client_name.toLowerCase().includes(term)) ||
        (u.project_name && u.project_name.toLowerCase().includes(term)) ||
        (u.status && u.status.toLowerCase().includes(term)) ||
        (u.description && u.description.toLowerCase().includes(term))
      );
    }

    // Date filter
    if (fromDate) {
      const from = new Date(fromDate);
      filtered = filtered.filter(u =>
        u.created_at && new Date(u.created_at) >= from
      );
    }

    if (toDate) {
      const to = new Date(toDate + "T23:59:59");
      filtered = filtered.filter(u =>
        u.created_at && new Date(u.created_at) <= to
      );
    }

    // Status filter
    if (currentStatus !== "all") {
      filtered = filtered.filter(u => u.status === currentStatus);
    }

    currentFiltered = filtered;
    renderTable(filtered);
    attachRowEvents();
    paginate(1);
  }

  // ===================
  // Render Table
  // ===================
  function renderTable(data) {
    tableBody.innerHTML = "";
    if (!data.length) {
      tableBody.innerHTML = `<tr><td colspan="6" class="text-center">No records found</td></tr>`;
      return;
    }

    data.forEach((upd, index) => {
      const row = `
        <tr>
          <td>${index + 1}</td>
          <td>${upd.client_name || "-"}</td>
          <td>${upd.project_name || "-"}</td>
          <td>${upd.status || "-"}</td>
          <td>${upd.description || "-"}</td>
          <td>
            <div class="d-flex flex-nowrap">
              <button class="btn btn-sm view-btn me-1" data-id="${upd.id}">
                <img src="images/View.png" alt="View">
              </button>
              <button class="btn btn-sm edit-btn me-1" data-id="${upd.id}">
                <img src="images/Edit.png" alt="Edit">
              </button>
              <button class="btn btn-sm delete-btn" data-id="${upd.id}">
                <img src="images/Delete.png" alt="Delete">
              </button>
            </div>
          </td>
        </tr>`;
      tableBody.insertAdjacentHTML("beforeend", row);
    });
  }

  // ===================
  // Row Actions
  // ===================
  function attachRowEvents() {
    // View
    document.querySelectorAll(".view-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        try {
          const res = await fetch(`http://127.0.0.1:8000/api/updations/${btn.dataset.id}/`);
          if (!res.ok) throw new Error("Failed to fetch record");
          const upd = await res.json();
          const modalBody = document.getElementById("viewClientBody");
          modalBody.innerHTML = `
            <div class="container-fluid">
              <div class="row g-3">
                <div class="col-md-4"><strong>Client Name:</strong> ${upd.client_name}</div>
                <div class="col-md-4"><strong>Project Name:</strong> ${upd.project_name}</div>
                <div class="col-md-4"><strong>Status:</strong> ${upd.status}</div>
                <div class="col-md-4"><strong>Created At:</strong> ${upd.created_at ? new Date(upd.created_at).toLocaleString() : "-"}</div>
                <div class="col-12"><strong>Description:</strong><br>${upd.description || "-"}</div>
              </div>
            </div>`;
          new bootstrap.Modal(document.getElementById("viewClientModal")).show();
        } catch (err) {
          console.error(err);
          alert("Failed to load record details");
        }
      });
    });

    // Edit
    document.querySelectorAll(".edit-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        window.location.href = `addupdation.html?edit=${btn.dataset.id}`;
      });
    });

    // Delete
    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        if (!confirm("Are you sure you want to delete this record?")) return;
        try {
          const res = await fetch(`http://127.0.0.1:8000/api/updations/${btn.dataset.id}/`, {
            method: "DELETE"
          });
          if (res.ok || res.status === 204) {
            alert("Record deleted successfully!");
            await loadUpdations();
          } else {
            alert("Failed to delete record");
          }
        } catch (err) {
          console.error(err);
          alert("Something went wrong!");
        }
      });
    });
  }

  // ===================
  // Pagination
  // ===================
  function paginate(page) {
    const rows = document.querySelectorAll(".table-data tr");
    const totalPages = Math.ceil(rows.length / rowsPerPage);
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;
    currentPageNum = page;

    rows.forEach((row, i) => {
      const start = (page - 1) * rowsPerPage;
      const end = page * rowsPerPage;
      row.style.display = i >= start && i < end ? "" : "none";
    });
  }

  // ===================
  // Search + Reset + Pagination Setup
  // ===================
  function initSearchAndPagination() {
    const searchInput = document.querySelector(".search-div input");
    const searchBtn = document.querySelector(".custom-search");
    const resetBtn = document.querySelector(".custom-reset");

    searchBtn?.addEventListener("click", applyFilters);
    searchInput?.addEventListener("keyup", e => { if (e.key === "Enter") applyFilters(); });

    resetBtn?.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      document.getElementById("fromDate").value = "";
      document.getElementById("toDate").value = "";
      currentStatus = "all";
      const statusBtn = document.querySelector(".custom-category");
      if (statusBtn) statusBtn.innerText = "All Status";
      applyFilters();
    });

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
        if (txt === "previous") paginate(currentPageNum - 1);
        else if (txt === "next") paginate(currentPageNum + 1);
        else if (!isNaN(parseInt(txt))) paginate(parseInt(txt));
      });
    });
  }

  // ===================
  // Status Filter Dropdown
  // ===================
  function initStatusFilter() {
    const statusBtn = document.querySelector(".custom-category");
    if (!statusBtn) return;

    const statuses = [...new Set(allUpdations.map(u => u.status).filter(Boolean))];
    const dropdownHtml = `
      <ul class="dropdown-menu show" style="position:absolute; z-index:1000;">
        <li><a class="dropdown-item status-option" data-status="all">All Status</a></li>
        ${statuses.map(st => `<li><a class="dropdown-item status-option" data-status="${st}">${st}</a></li>`).join("")}
      </ul>
    `;

    let dropdown = null;
    statusBtn.addEventListener("click", e => {
      e.stopPropagation();
      if (dropdown) {
        dropdown.remove();
        dropdown = null;
      } else {
        statusBtn.insertAdjacentHTML("afterend", dropdownHtml);
        dropdown = statusBtn.nextElementSibling;

        dropdown.querySelectorAll(".status-option").forEach(opt => {
          opt.addEventListener("click", () => {
            currentStatus = opt.dataset.status;
            statusBtn.innerText = opt.innerText;
            applyFilters();
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
  // Excel Export
  // ===================
  document.getElementById("exportBtn")?.addEventListener("click", () => {
    if (!currentFiltered.length) {
      alert("No records to export!");
      return;
    }

    const data = currentFiltered.map(c => ({
      "Client Name": c.client_name || "-",
      "Project Name": c.project_name || "-",
      "Status": c.status || "-",
      "Description": c.description || "-",
      "Created At": c.created_at ? new Date(c.created_at).toLocaleString() : "-"
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const colWidths = Object.keys(data[0]).map(key => ({
      wch: Math.max(key.length + 2, ...data.map(r => (r[key]?.length || 0) + 2))
    }));
    ws["!cols"] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Updations");
    XLSX.writeFile(wb, "Updations.xlsx");
  });

  // ===================
  // Load Data
  // ===================
  await loadUpdations();
});
