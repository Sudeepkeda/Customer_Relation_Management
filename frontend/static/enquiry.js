// ===================
// Sidebar + Table + API Integration for Enquiries
// ===================
document.addEventListener("DOMContentLoaded", async () => {

const BASE_URL = window.location.origin;
 document.querySelectorAll(".nav-list .nav-link").forEach(link => {
  const linkHref = link.getAttribute("href").toLowerCase();
  const currentPath = window.location.pathname.toLowerCase();

  
  if (currentPath === linkHref || currentPath.startsWith(linkHref + "/")) {
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

  const tableBody = document.querySelector(".table-data");
  let allEnquiries = []; // full list for filtering
  let currentFiltered = []; // current filtered data for export
  let currentStatus = 'all'; // current status filter

  // Dashboard can send /enquiry/?filter=notstarted (or other statuses)
  const urlFilter = new URLSearchParams(window.location.search).get("filter");
  // If coming from dashboard, we can "lock" the status filter to show only that status
  let lockedStatus = null;
  if (urlFilter) {
    const f = urlFilter.toLowerCase();
    if (f === "all") currentStatus = "all";
    else if (f === "notstarted" || f === "not started" || f === "onhold" || f === "on-hold") currentStatus = "Notstarted";
    else if (f === "inprogress" || f === "in progress" || f === "in-progress") currentStatus = "Inprogress";
    else if (f === "completed" || f === "complete") currentStatus = "Completed";
    else currentStatus = urlFilter; // fallback to exact value

    // Lock the filter if it's a specific status (not "all")
    if (currentStatus !== "all") lockedStatus = currentStatus;
  }
  
  //profile redirection
  const profileLogo = document.querySelector(".dashboard-head img");
    if (profileLogo) {
      profileLogo.addEventListener("click", () => {
        window.location.href = "/user-profile/";
      });
    }

  // ===================
  // Apply Filters Function
  // ===================
  function applyFilters() {
    const searchInput = document.querySelector(".search-div input");
    const term = searchInput ? searchInput.value.toLowerCase().trim() : '';
    let filtered = [...allEnquiries];

    // Term filter
    if (term) {
      filtered = filtered.filter(c =>
        (c.company_name && c.company_name.toLowerCase().includes(term)) ||
        (c.person_name && c.person_name.toLowerCase().includes(term)) ||
        (c.email && c.email.toLowerCase().includes(term)) ||
        (c.status && c.status.toLowerCase().includes(term))
      );
    }

    // Date filter
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
    const statusToApply = lockedStatus || currentStatus;
    if (statusToApply !== 'all') {
  const normalize = (s) => (s || "").toLowerCase().replace(/\s+/g, "");

  filtered = filtered.filter(c => 
    normalize(c.status) === normalize(statusToApply)
  );
}

    currentFiltered = filtered;
    renderTable(filtered);
    initActions();
    paginate(1);
  }

  // ===================
  // Fetch Enquiries
  // ===================
  async function loadEnquiries() {
    try {
const token = localStorage.getItem("authToken");
const response = await fetch(`${BASE_URL}/api/enquiries/`, {
  headers: {
    "Authorization": "Token " + token,
    "Content-Type": "application/json",
  },
});
      if (!response.ok) throw new Error("Failed to fetch enquiries");

      allEnquiries = await response.json();
      currentFiltered = [...allEnquiries];
      initSearchAndPagination();
      initStatusFilter();
      applyFilters();

    } catch (err) {
      console.error("Error loading enquiries:", err);
      tableBody.innerHTML = `<tr><td colspan="9" class="text-center text-danger">Failed to load enquiries.</td></tr>`;
    }
  }

  // ===================
  // Render Table
  // ===================
  function renderTable(enquiries) {
    tableBody.innerHTML = "";

    if (enquiries.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="9" class="text-center">No enquiries found</td></tr>`;
      return;
    }

    enquiries.forEach((enquiry, index) => {
      const row = `
        <tr>
          <td>${index + 1}</td>
          <td>${enquiry.date || "-"}</td>
          <td>${enquiry.company_name || "-"}</td>
          <td>${enquiry.person_name || "-"}</td>
          <td>${enquiry.contact_number || "-"}</td>
          <td>${enquiry.email || "-"}</td>
          <td>${enquiry.website || "-"}</td>
          <td>${enquiry.status || "-"}</td>
          <td>
            <div class="d-flex flex-nowrap">
              <button class="btn btn-sm me-1 view-btn" data-id="${enquiry.id}">
                <img src="/static/images/View.png" alt="View">
              </button>
              <button class="btn btn-sm edit-btn" data-id="${enquiry.id}">
                <img src="/static/images/Edit.png" alt="Edit">
              </button>
              <button class="btn btn-sm delete-btn" data-id="${enquiry.id}">
                <img src="/static/images/Delete.png" alt="Delete">
              </button>
            </div>
          </td>
        </tr>
      `;
      tableBody.insertAdjacentHTML("beforeend", row);
    });
    
  }

  // ===================
  // View / Edit / Delete Actions
  // ===================
  function initActions() {
    // View
    document.querySelectorAll(".view-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const enquiryId = btn.dataset.id;
        try {
          const res = await fetch(`${BASE_URL}/api/enquiries/${enquiryId}/`, {
  headers: { "Authorization": "Token " + localStorage.getItem("authToken") },
});

          if (!res.ok) throw new Error("Failed to fetch enquiry details");
          const enquiry = await res.json();

          const html = `
            <div class="container-fluid">
              <div class="row g-3 ">
                <div class="col-md-4"><strong>Date:</strong> ${enquiry.date || "-"}</div>
                <div class="col-md-4"><strong>Company Name:</strong> ${enquiry.company_name || "-"}</div>
                <div class="col-md-4"><strong>Person Name:</strong> ${enquiry.person_name || "-"}</div>
                <div class="col-md-4"><strong>Contact Number:</strong> ${enquiry.contact_number || "-"}</div>
                <div class="col-md-4 text-break"><strong>Email:</strong> ${enquiry.email || "-"}</div>
                <div class="col-md-4 text-break"><strong>Website:</strong> ${enquiry.website || "-"}</div>
                <div class="col-md-4"><strong>Status:</strong> ${enquiry.status || "-"}</div>
                <div class="col-12"><strong>Comments:</strong> ${enquiry.comments || "-"}</div>
              </div>
            </div>
          `;
          document.getElementById("viewClientBody").innerHTML = html;
          new bootstrap.Modal(document.getElementById("viewClientModal")).show();
        } catch (error) {
          console.error(error);
          //alert("Failed to load enquiry details.");
        }
      });
    });

    // Edit
    document.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        localStorage.setItem("editEnquiryId", btn.dataset.id);
        window.location.href = "/addenquiry";
      });
    });

    // Delete
    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
       // if (!confirm("Are you sure you want to delete this enquiry?")) return;
        try {
          const res = await fetch(`${BASE_URL}/api/enquiries/${btn.dataset.id}/`, {
  method: "DELETE",
  headers: { "Authorization": "Token " + localStorage.getItem("authToken") },
});

          if (res.ok) {
           // alert("Enquiry deleted successfully!");
            await loadEnquiries();
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
      const fromDateInput = document.getElementById('fromDate');
      const toDateInput = document.getElementById('toDate');
      if (fromDateInput) fromDateInput.value = "";
      if (toDateInput) toDateInput.value = "";
      currentStatus = 'all';
      const statusBtn = document.querySelector(".custom-category");
      if (statusBtn) statusBtn.innerText = 'All Status';
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

    // Expose paginate for other functions
    window.paginate = paginate;
  }

  // ===================
  // Status Filter
  // ===================
  function initStatusFilter() {
    const statusBtn = document.querySelector(".custom-category");
    if (!statusBtn) return;

    // Reflect currentStatus in button when page opened with ?filter=
    if ((lockedStatus || currentStatus) && (lockedStatus || currentStatus) !== "all") statusBtn.innerText = (lockedStatus || currentStatus);
    else statusBtn.innerText = "All Status";

    // If locked, do not allow changing from dropdown
    if (lockedStatus) {
      statusBtn.classList.add("disabled");
      statusBtn.setAttribute("aria-disabled", "true");
      return;
    }

    const statuses = [...new Set(allEnquiries.map(c => c.status).filter(Boolean))];
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
  // Add Enquiry Button
  // ===================
  document.querySelector(".custombtn")?.addEventListener("click", () => {
    localStorage.removeItem("editEnquiryId");
    window.location.href = "/addenquiry";
  });

  // Load enquiries on page load
  await loadEnquiries();

  
const exportBtn = document.getElementById("exportBtn");

exportBtn.addEventListener("click", () => {
  if (!currentFiltered.length) {
    // alert("No enquiries to export!");
    return;
  }

  // Pagination filter — include only currently visible rows
  const rowsPerPage = parseInt(document.getElementById("pageInput")?.value || "10", 10);
  const tableRows = Array.from(document.querySelectorAll(".table-data tr"));
  const visibleRows = tableRows.filter(row => row.style.display !== "none");

  // Get visible enquiry indexes (based on the first <td> column index)
  const visibleIndexes = visibleRows.map(row => {
    const idxCell = row.querySelector("td:first-child");
    return idxCell ? parseInt(idxCell.textContent, 10) - 1 : -1;
  }).filter(i => i >= 0);

  // Filter only the visible (paginated) enquiries
  const exportData = visibleIndexes.map(i => currentFiltered[i]);

  if (!exportData.length) {
    //alert("No visible enquiries to export!");
    return;
  }

  // Map data for Excel
  const data = exportData.map(c => ({
    "Date": c.date || "-",
    "Person Name": c.person_name || "-",
    "Company Name": c.company_name || "-",
    "Contact Number": c.contact_number || "-",
    "Email": c.email || "-",
    "Website": c.website || "-",
    "Status": c.status || "-",
    "Comments": c.comments || "-",
  }));

  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(data);

  // Auto-size columns
  const colWidths = Object.keys(data[0]).map(key => ({
    wch: Math.max(key.length + 2, ...data.map(r => (r[key]?.length || 0) + 2))
  }));
  ws["!cols"] = colWidths;

  // Create workbook and append
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Filtered_Enquiries");

  // Download Excel file
  XLSX.writeFile(wb, "Enquiry.xlsx");
});


});