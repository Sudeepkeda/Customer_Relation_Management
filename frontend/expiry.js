// ===================
// Expiry.js - Expired Clients Management (Enhanced with Filters + Export)
// ===================

let allClients = [];
let currentFiltered = [];
let currentService = "all";

// ===================
// Sidebar + Table + API Integration
// ===================
document.addEventListener("DOMContentLoaded", async () => {
  const currentPage = window.location.pathname.split("/").pop().toLowerCase();
  document.querySelectorAll(".nav-list .nav-link").forEach(link => {
    const linkPage = link.getAttribute("href").toLowerCase();
    link.classList.toggle("active", linkPage === currentPage);
  });

  const profileLogo = document.querySelector(".dashboard-head img");
  if (profileLogo) {
    profileLogo.addEventListener("click", () => (window.location.href = "profile.html"));
  }

  const sidebar = document.getElementById("sidebar");
  const toggleBtn = document.getElementById("sidebarToggle");
  if (toggleBtn) toggleBtn.addEventListener("click", () => sidebar.classList.toggle("active"));

  await loadExpiryClients();
});

// ===================
// Fetch + Refresh Function
// ===================
async function loadExpiryClients() {
  try {
    const res = await fetch("http://127.0.0.1:8000/api/clients/", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch clients");
    allClients = await res.json();

    // Only clients with at least one expiring/expired service
    allClients = allClients.filter(c => getExpiryStatus(c).length > 0);
    currentFiltered = [...allClients];

    initSearchAndPagination();
    initCategoryFilter();
    applyFilters();
  } catch (err) {
    console.error("Error loading clients:", err);
  }
}

// ===================
// Helper Functions
// ===================
function normalizeDate(dateStr) {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysFromStart(startDateStr, endDateStr) {
  if (!startDateStr || !endDateStr) return 0;
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const diffMs = end - start;
  return Math.max(Math.ceil(diffMs / (1000 * 60 * 60 * 24)), 0);
}

function getExpiryStatus(client) {
  const services = [
    { name: "Domain", start: client.domain_start_date, end: client.domain_end_date },
    { name: "Server", start: client.server_start_date, end: client.server_end_date },
    { name: "Maintenance", start: client.maintenance_start_date, end: client.maintenance_end_date },
  ];
  return services.filter(s => s.start && s.end && daysFromStart(s.start, s.end) <= 60).map(s => s.name);
}

function getRemainingDays(client) {
  const services = [
    { short: "D", start: client.domain_start_date, end: client.domain_end_date },
    { short: "S", start: client.server_start_date, end: client.server_end_date },
    { short: "M", start: client.maintenance_start_date, end: client.maintenance_end_date },
  ];
  return services
    .filter(s => s.start && s.end)
    .map(s => ({ short: s.short, days: daysFromStart(s.start, s.end) }))
    .filter(s => s.days <= 60)
    .map(s => `${s.short}-${s.days}`)
    .join(", ") || "-";
}

// ===================
// Apply Filters (Search + Service + Date Range)
// ===================
function applyFilters() {
  const searchInput = document.querySelector(".search-div input");
  const term = searchInput ? searchInput.value.toLowerCase().trim() : "";

  const fromDate = document.getElementById("fromDate")?.value;
  const toDate = document.getElementById("toDate")?.value;

  let filtered = [...allClients];

  // Search filter
  if (term) {
    filtered = filtered.filter(
      c =>
        (c.person_name && c.person_name.toLowerCase().includes(term)) ||
        (c.email && c.email.toLowerCase().includes(term)) ||
        (c.contact_number && c.contact_number.toLowerCase().includes(term)) ||
        (c.priority && c.priority.toLowerCase().includes(term))
    );
  }

  // Service type filter
  if (currentService !== "all") {
    filtered = filtered.filter(c => getExpiryStatus(c).includes(currentService));
  }

  // Date filter: check if any end date falls within selected range
  if (fromDate || toDate) {
    const fromD = fromDate ? new Date(fromDate) : null;
    const toD = toDate ? new Date(toDate + "T23:59:59") : null;

    filtered = filtered.filter(c => {
      const dates = [c.domain_end_date, c.server_end_date, c.maintenance_end_date].filter(Boolean).map(d => new Date(d));
      return dates.some(d => (!fromD || d >= fromD) && (!toD || d <= toD));
    });
  }

  currentFiltered = filtered;
  renderTable(filtered);
  initActions();
  paginate(1);
}

// ===================
// Render Table
// ===================
function renderTable(clients) {
  const tableBody = document.querySelector(".table-data");
  tableBody.innerHTML = "";

  if (!clients.length) {
    tableBody.innerHTML = `<tr><td colspan="8" class="text-center">No clients found</td></tr>`;
    return;
  }

  clients.forEach((client, index) => {
    const expiredServices = getExpiryStatus(client);
    const remainingDays = getRemainingDays(client);
    const row = `
      <tr>
        <td>${index + 1}</td>
        <td>${client.person_name || "-"}</td>
        <td>${client.email || "-"}</td>
        <td>${client.contact_number || "-"}</td>
        <td>${expiredServices.join(", ")}</td>
        <td>${remainingDays}</td>
        <td>${client.priority || "-"}</td>
        <td>
          <div class="d-flex flex-nowrap">
            <button class="btn btn-sm me-1 view-btn" data-id="${client.id}">
              <img src="images/View.png" alt="View">
            </button>
            <button class="btn btn-sm btn-send" data-id="${client.id}">
              <img src="images/send.png" alt="Send">
            </button>
          </div>
        </td>
      </tr>`;
    tableBody.insertAdjacentHTML("beforeend", row);
  });
}

// ===================
// View + Send Mail Actions
// ===================
function initActions() {
  document.querySelectorAll(".view-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const res = await fetch(`http://127.0.0.1:8000/api/clients/${id}/`);
      const client = await res.json();
      const html = `
        <div class="container-fluid">
          <div class="row g-3">
            <div class="col-md-4"><strong>Client:</strong> ${client.person_name || "-"}</div>
            <div class="col-md-4"><strong>Email:</strong> ${client.email || "-"}</div>
            <div class="col-md-4"><strong>Contact:</strong> ${client.contact_number || "-"}</div>
            <div class="col-md-4"><strong>Domain End:</strong> ${client.domain_end_date || "-"}</div>
            <div class="col-md-4"><strong>Server End:</strong> ${client.server_end_date || "-"}</div>
            <div class="col-md-4"><strong>Maintenance End:</strong> ${client.maintenance_end_date || "-"}</div>
            <div class="col-md-4"><strong>Expired Services:</strong> ${getExpiryStatus(client).join(", ") || "-"}</div>
            <div class="col-md-4"><strong>Remaining Days:</strong> ${getRemainingDays(client)}</div>
          </div>
        </div>`;
      document.getElementById("viewClientBody").innerHTML = html;
      new bootstrap.Modal(document.getElementById("viewClientModal")).show();
    });
  });

  document.querySelectorAll(".btn-send").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const res = await fetch(`http://127.0.0.1:8000/api/clients/${id}/`);
      const client = await res.json();

      const expiring = getExpiryStatus(client);
      if (!expiring.length) return alert("No expiring services found.");

      try {
        const sendRes = await fetch(`http://127.0.0.1:8000/api/send-renewal-mail/${id}/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ service: expiring[0] })
        });
        if (!sendRes.ok) throw new Error("Failed to send");
        alert(`✅ Renewal reminder sent for ${expiring[0]} to ${client.email}`);
        await loadExpiryClients();
      } catch (err) {
        console.error(err);
        alert("❌ Failed to send renewal email.");
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
  searchInput?.addEventListener("keyup", e => e.key === "Enter" && applyFilters());
  resetBtn?.addEventListener("click", () => {
    searchInput.value = "";
    document.getElementById("fromDate").value = "";
    document.getElementById("toDate").value = "";
    currentService = "all";
    document.querySelector(".custom-category").innerText = "All Expired/Expiring";
    applyFilters();
  });

  let rowsPerPage = 10;
  let currentPage = 1;

  function paginate(page) {
    const rows = document.querySelectorAll(".table-data tr");
    const totalPages = Math.ceil(rows.length / rowsPerPage);
    currentPage = Math.max(1, Math.min(page, totalPages));
    rows.forEach((row, i) => {
      const start = (currentPage - 1) * rowsPerPage;
      const end = currentPage * rowsPerPage;
      row.style.display = i >= start && i < end ? "" : "none";
    });
  }

  document.getElementById("pageInput")?.addEventListener("input", e => {
    const val = parseInt(e.target.value, 10);
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
// Service Category Filter
// ===================
function initCategoryFilter() {
  const categoryBtn = document.querySelector(".custom-category");
  if (!categoryBtn) return;

  const services = ["Domain", "Server", "Maintenance"];
  const dropdownHtml = `
    <ul class="dropdown-menu show" style="position:absolute; z-index:1000;">
      <li><a class="dropdown-item service-option" data-service="all">All Expired/Expiring</a></li>
      ${services.map(s => `<li><a class="dropdown-item service-option" data-service="${s}">${s}</a></li>`).join("")}
    </ul>`;

  let dropdown = null;
  categoryBtn.addEventListener("click", e => {
    e.stopPropagation();
    if (dropdown) {
      dropdown.remove();
      dropdown = null;
    } else {
      categoryBtn.insertAdjacentHTML("afterend", dropdownHtml);
      dropdown = categoryBtn.nextElementSibling;
      dropdown.querySelectorAll(".service-option").forEach(opt => {
        opt.addEventListener("click", () => {
          currentService = opt.dataset.service;
          categoryBtn.innerText = opt.innerText;
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
// Export to Excel (Filtered + Paginated)
// ===================
document.getElementById("exportBtn").addEventListener("click", () => {
  const visibleRows = Array.from(document.querySelectorAll(".table-data tr")).filter(r => r.style.display !== "none");
  if (!visibleRows.length) return alert("No data to export!");

  const data = visibleRows.map(row => {
    const cells = row.querySelectorAll("td");
    return {
      "SL No": cells[0]?.innerText || "",
      "Client Name": cells[1]?.innerText || "",
      "Email": cells[2]?.innerText || "",
      "Contact Number": cells[3]?.innerText || "",
      "Expired Services": cells[4]?.innerText || "",
      "Remaining Days": cells[5]?.innerText || "",
      "Priority": cells[6]?.innerText || ""
    };
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Expired Clients");
  XLSX.writeFile(wb, "Filtered_Expired_Clients.xlsx");
});
