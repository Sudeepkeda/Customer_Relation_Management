// ===================
// Sidebar + Table + API Integration for Updations
// ===================
document.addEventListener("DOMContentLoaded", async () => {
  const BASE_URL = "https://crm.design-bharat.com";
  // -------------------
  // Sidebar Active Highlight
  // -------------------
  document.querySelectorAll(".nav-list .nav-link").forEach(link => {
    const linkHref = link.getAttribute("href").toLowerCase();
    const currentPath = window.location.pathname.toLowerCase();
    if (currentPath === linkHref || currentPath.startsWith(linkHref + "/")) {
    link.classList.add("active");
  } else {
    link.classList.remove("active");
  }
  });

  // Sidebar Toggle
  const sidebar = document.getElementById("sidebar");
  const toggleBtn = document.getElementById("sidebarToggle");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      sidebar.classList.toggle("active");
    });
  }

  const tableBody = document.querySelector(".table-data");
  let allUpdations = [];
  let currentFiltered = [];
  let currentStatus = "all";

  // If dashboard sends /updation/?filter=Completed|New|Inprogress|Notstarted
  const urlFilter = new URLSearchParams(window.location.search).get("filter");
  if (urlFilter) {
    const f = urlFilter.toLowerCase();
    if (f === "all") currentStatus = "all";
    else if (f === "onhold" || f === "on-hold" || f === "hold") currentStatus = "Notstarted";
    else if (f === "inprogress" || f === "in-progress" || f === "in progress") currentStatus = "Inprogress";
    else if (f === "new") currentStatus = "New";
    else if (f === "completed" || f === "complete") currentStatus = "Completed";
    else currentStatus = urlFilter; // fallback: exact value
  }

  //profile redirection
  const profileLogo = document.querySelector(".dashboard-head img");
    if (profileLogo) {
      profileLogo.addEventListener("click", () => {
        window.location.href = "/user-profile/";
      });
    }
    
    
    
    
    // ===================
  // Apply Filters
  // ===================
  function applyFilters() {
    const searchInput = document.querySelector(".search-div input");
    const term = searchInput ? searchInput.value.toLowerCase().trim() : "";
    let filtered = [...allUpdations];

    // Search filter
    if (term) {
      filtered = filtered.filter(u =>
        (u.client_name && u.client_name.toLowerCase().includes(term)) ||
        (u.project_name && u.project_name.toLowerCase().includes(term)) ||
        (u.status && u.status.toLowerCase().includes(term)) ||
        (u.description && u.description.toLowerCase().includes(term))
      );
    }

    /// Date filter
    const fromDateInput = document.getElementById('fromDate');
    const toDateInput = document.getElementById('toDate');
    const fromDate = fromDateInput ? fromDateInput.value : '';
    const toDate = toDateInput ? toDateInput.value : '';

    if (fromDate) {
      const fromD = new Date(fromDate);
      filtered = filtered.filter(c => {
        if (!c.date) return false;
        return new Date(c.date) >= fromD;
      });
    }

    if (toDate) {
      const toD = new Date(toDate + 'T23:59:59');
      filtered = filtered.filter(c => {
        if (!c.date) return false;
        return new Date(c.date) <= toD;
      });
    }


    // Status filter
    if (currentStatus !== "all") {
      filtered = filtered.filter(u => u.status === currentStatus);
    }

    currentFiltered = filtered;
    renderTable(filtered);
    initActions();
    paginate(1);
  }
  
  // ===================
  // Fetch Updations
  // ===================
  async function loadUpdations() {
    try {
      const token = localStorage.getItem("authToken");
      const response=await fetch(`${BASE_URL}/api/updations/`,{
           headers: {
                "Authorization": "Token " + token,
                "Content-Type": "application/json",
       },
      });
      
      if (!response.ok) throw new Error("Failed to fetch updations");
      
        allUpdations =await response.json();
        currentFiltered = [...allUpdations];
        initSearchAndPagination();
        initStatusFilter();
        applyFilters();
    } catch (err) {
      console.error("Error loading updations:", err);
      tableBody.innerHTML = `<tr><td colspan="9" class="text-center text-danger">Failed to load updations.</td></tr>`;
    }
  }
  

  // ===================
  // Render Table
  // ===================
   function renderTable(data) {
    tableBody.innerHTML = "";

    if (data.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="7" class="text-center">No updations found</td></tr>`;
      return;
    }

    data.forEach((upd, index) => {
      // prefer explicit date field, fallback to created_at
      const displayDate = upd.date
        ? upd.date
        : (upd.created_at ? new Date(upd.created_at).toISOString().split("T")[0] : "-");

      const row = `
  <tr>
    <td>${index + 1}</td>
    <td>${upd.client_name || "-"}</td>
    <td>${upd.project_name || "-"}</td>
    <td>${upd.status || "-"}</td>
    <td>${displayDate}</td>
    <td>${upd.description || "-"}</td>
    <td>
      <div class="d-flex flex-nowrap">
        <button class="btn btn-sm me-1 view-btn" data-id="${upd.id}">
          <img src="/static/images/View.png" alt="View">
        </button>
        <button class="btn btn-sm edit-btn" data-id="${upd.id}">
          <img src="/static/images/Edit.png" alt="Edit">
        </button>
        <button class="btn btn-sm delete-btn" data-id="${upd.id}">
          <img src="/static/images/Delete.png" alt="Delete">
        </button>
      </div>
    </td>
  </tr>`;

      tableBody.insertAdjacentHTML("beforeend", row);
    });
  }

  // ===================
  // View / Edit / Delete Actions
  // ===================
    function initActions() {
    // View
    document.querySelectorAll(".view-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const updationsId =  btn.dataset.id;
        try {
          const res = await fetch(`${BASE_URL}/api/updations/${updationsId}/`, {
            headers: { "Authorization": "Token " + localStorage.getItem("authToken") },
          });
          if (!res.ok) throw new Error("Failed to fetch updation details");
          const upd = await res.json();

          const displayDate = upd.date
            ? upd.date
            : (upd.created_at ? new Date(upd.created_at).toISOString().split("T")[0] : "-");

          const html = `
            <div class="container-fluid">
              <div class="row g-3">
                <div class="col-md-4"><strong>Client Name:</strong> ${upd.client_name || "-"}</div>
                <div class="col-md-4"><strong>Project Name:</strong> ${upd.project_name || "-"}</div>
                <div class="col-md-4"><strong>Status:</strong> ${upd.status || "-"}</div>
                <div class="col-md-4"><strong>Date:</strong> ${displayDate}</div>
                <div class="col-12"><strong>Description:</strong> ${upd.description || "-"}</div>
              </div>
            </div>`;
          document.getElementById("viewClientBody").innerHTML = html;
          new bootstrap.Modal(document.getElementById("viewClientModal")).show();
        } catch (err) {
          console.error(err);
          //alert("Failed to load updation details.");
        }
      });
    });

    // Edit
document.querySelectorAll(".edit-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        sessionStorage.setItem("editUpdationId", btn.dataset.id);  
        window.location.href = "/updation/add";
      });
    });

    // Delete
    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        //if (!confirm("Are you sure you want to delete this updation?")) return;
        try {
          const res = await fetch(`${BASE_URL}/api/updations/${btn.dataset.id}/`, {
              method: "DELETE",
              headers: { "Authorization": "Token " + localStorage.getItem("authToken") },
            });

          if (res.ok) {
            //alert("Updation deleted successfully!");
            await loadUpdations();
          }
        } catch (err) {
          console.error(err);
          //alert("Something went wrong while deleting.");
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
    searchInput?.addEventListener("keyup", (e) => { if (e.key === "Enter") applyFilters(); });
    resetBtn?.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      const fromDateInput = document.getElementById("fromDate");
      const toDateInput = document.getElementById("toDate");
      if (fromDateInput) fromDateInput.value = "";
      if (toDateInput) toDateInput.value = "";
      currentStatus = "all";
      const statusBtn = document.querySelector(".custom-category");
      if (statusBtn) statusBtn.innerText = "All Status";
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

    window.paginate = paginate;
  }

  // ===================
  // Status Filter
  // ===================
  function initStatusFilter() {
    const statusBtn = document.querySelector(".custom-category");
    if (!statusBtn) return;

    // If opened with ?filter=..., reflect it in the button label
    if (currentStatus && currentStatus !== "all") statusBtn.innerText = currentStatus;
    else statusBtn.innerText = "All Status";

    const statuses = [...new Set(allUpdations.map(u => u.status).filter(Boolean))];
    const dropdownHtml = `
      <ul class="dropdown-menu show" style="position:absolute; z-index:1000;">
        <li><a class="dropdown-item status-option" data-status="all">All Status</a></li>
        ${statuses.map(st => `<li><a class="dropdown-item status-option" data-status="${st}">${st}</a></li>`).join("")}
      </ul>
    `;

    let dropdown = null;
    statusBtn.addEventListener("click", (e) => {
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

    document.addEventListener("click", () => { if (dropdown) { dropdown.remove(); dropdown = null; } });
  }

  // ===================
  // Add Updation Button
  // ===================
  document.querySelector(".custombtn")?.addEventListener("click", () => {
    sessionStorage.removeItem("editUpdationId");
    window.location.href = "/updation/add";
  });
  
  
  
  // ===================
  // Excel Export
  // ===================
  const exportBtn = document.getElementById("exportBtn");
  exportBtn?.addEventListener("click", () => {
    if (!currentFiltered.length) {
     // alert("No updations to export!");
      return;
    }

    const tableRows = Array.from(document.querySelectorAll(".table-data tr"));
    const visibleRows = tableRows.filter(row => row.style.display !== "none");
    const visibleIndexes = visibleRows.map(row => {
      const idxCell = row.querySelector("td:first-child");
      return idxCell ? parseInt(idxCell.textContent, 10) - 1 : -1;
    }).filter(i => i >= 0);
    const exportData = visibleIndexes.map(i => currentFiltered[i]);

    const data = exportData.map(u => ({
      "Client Name": u.client_name || "-",
      "Project Name": u.project_name || "-",
      "Status": u.status || "-",
      "Date": u.date ? u.date : (u.created_at ? new Date(u.created_at).toLocaleDateString() : "-"),
      "Description": u.description || "-",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const colWidths = Object.keys(data[0]).map(key => ({
      wch: Math.max(key.length + 2, ...data.map(r => (r[key]?.length || 0) + 2))
    }));
    ws["!cols"] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Filtered_Updations");
    XLSX.writeFile(wb, "Updation.xlsx");
  });
  // ===================
  // Load on Page Load
  // ===================
  await loadUpdations();
});
