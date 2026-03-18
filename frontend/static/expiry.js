// ===============================
// EXPIRY PGE 
// ===============================
(function () {

const BASE_URL = "https://crm.design-bharat.com";

let EXP_allClients = [];
let EXP_currentFiltered = [];
let EXP_currentService = "all";
let EXP_maxDays = 60; // default (existing behavior)

// -------------------------------------
// HELPERS
// -------------------------------------
function EXP_daysBetween(startDateStr, endDateStr) {
  if (!startDateStr || !endDateStr) return 9999;
  const d1 = new Date(startDateStr);
  const d2 = new Date(endDateStr);
  // Can be negative if already expired
  return Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
}

function EXP_getExpiringServices(client) {
  const services = [
    { name: "Domain", start: client.domain_start_date, end: client.domain_end_date },
    { name: "Server", start: client.server_start_date, end: client.server_end_date },
    { name: "Maintenance", start: client.maintenance_start_date, end: client.maintenance_end_date }
  ];

  return services
    .filter(s => s.start && s.end && EXP_daysBetween(s.start, s.end) <= EXP_maxDays)
    .map(s => s.name);
}

function EXP_getRemainingDays(client) {
  const list = [
    { short: "D", start: client.domain_start_date, end: client.domain_end_date },
    { short: "S", start: client.server_start_date, end: client.server_end_date },
    { short: "M", start: client.maintenance_start_date, end: client.maintenance_end_date }
  ];

  return list
    .filter(s => s.start && s.end)
    .map(s => ({ short: s.short, days: EXP_daysBetween(s.start, s.end) }))
    .filter(s => s.days <= EXP_maxDays)
    .map(s => {
      // If <= 0 days, show as Expired (avoid negative like D--20)
      if (s.days <= 0) return `${s.short}-Expired`;
      return `${s.short}-${s.days}`;
    })
    .join(", ") || "-";
}

// -------------------------------------
// RENDER TABLE
// -------------------------------------
function EXP_renderTable(clients) {
  const tableBody = document.querySelector(".table-data");
  tableBody.innerHTML = "";

  if (!clients.length) {
    tableBody.innerHTML = `<tr><td colspan="8" class="text-center">No expiring clients found</td></tr>`;
    return;
  }

  clients.forEach((c, i) => {
    const row = `
      <tr>
        <td>${i + 1}</td>
        <td>${c.person_name || "-"}</td>
        <td>${c.email || "-"}</td>
        <td>${c.contact_number || "-"}</td>
        <td>${EXP_getExpiringServices(c).join(", ")}</td>
        <td>${EXP_getRemainingDays(c)}</td>
        <td>${c.priority || "-"}</td>
        <td>
          <button class="btn btn-sm me-1 exp-view-btn" data-id="${c.id}">
            <img src="/static/images/View.png" />
          </button>
          <button class="btn btn-sm exp-send-btn" data-id="${c.id}">
            <img src="/static/images/send.png" />
          </button>
        </td>
      </tr>
    `;
    tableBody.insertAdjacentHTML("beforeend", row);
  });

  EXP_initActions();
}

// -------------------------------------
// FILTERS
// -------------------------------------
function EXP_applyFilters() {
  const search = document.querySelector(".search-div input")?.value.toLowerCase().trim() || "";
  const fromDate = document.getElementById("fromDate")?.value;
  const toDate = document.getElementById("toDate")?.value;

  let filtered = [...EXP_allClients];

  // Days filter (from dashboard: /expiry/?days=5|15|30|60)
  // Keep a client if ANY service has remaining days <= EXP_maxDays
  filtered = filtered.filter(c => {
    const daysList = [
      EXP_daysBetween(c.domain_start_date, c.domain_end_date),
      EXP_daysBetween(c.server_start_date, c.server_end_date),
      EXP_daysBetween(c.maintenance_start_date, c.maintenance_end_date),
    ].filter(d => Number.isFinite(d));

    return daysList.some(d => d <= EXP_maxDays);
  });

  // Search
  if (search) {
    filtered = filtered.filter(c =>
      (c.person_name || "").toLowerCase().includes(search) ||
      (c.email || "").toLowerCase().includes(search) ||
      (c.contact_number || "").includes(search) ||
      (c.priority || "").toLowerCase().includes(search)
    );
  }

  // Service filter
  if (EXP_currentService !== "all") {
    filtered = filtered.filter(c => EXP_getExpiringServices(c).includes(EXP_currentService));
  }

  // Date range
  if (fromDate || toDate) {
    const fromD = fromDate ? new Date(fromDate) : null;
    const toD = toDate ? new Date(toDate + "T23:59:59") : null;

    filtered = filtered.filter(c => {
      const dates = [
        c.domain_end_date,
        c.server_end_date,
        c.maintenance_end_date
      ]
        .filter(Boolean)
        .map(d => new Date(d));

      return dates.some(d =>
        (!fromD || d >= fromD) &&
        (!toD || d <= toD)
      );
    });
  }

  EXP_currentFiltered = filtered;
  EXP_renderTable(filtered);
  EXP_paginate(1);
}

// -------------------------------------
// Read query params (days) on load
// -------------------------------------
function EXP_initFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const daysParam = params.get("days");
  if (!daysParam) return;
  const n = parseInt(daysParam, 10);
  if (!isNaN(n) && n > 0) {
    EXP_maxDays = n;
  }
}

// -------------------------------------
// ACTION BUTTONS
// -------------------------------------
function EXP_initActions() {
  // VIEW
  document.querySelectorAll(".exp-view-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const token = localStorage.getItem("authToken");

      const res = await fetch(`${BASE_URL}/api/clients/${id}/`, {
        headers: { "Authorization": `Token ${token}` }
      });

      const client = await res.json();
      const html = `
        <div class="row g-3">
          <div class="col-md-4"><strong>Name:</strong> ${client.person_name}</div>
          <div class="col-md-4"><strong>Email: </strong>${client.email}</div>
          <div class="col-md-4"><strong>Contact:</strong> ${client.contact_number}</div>
          <div class="col-md-4"><strong>Domain End:</strong> ${client.domain_end_date}</div>
          <div class="col-md-4"><strong>Server End:</strong> ${client.server_end_date}</div>
          <div class="col-md-4"><strong>Maintenance End:</strong> ${client.maintenance_end_date}</div>
          <div class="col-md-4"><strong>Expiring:</strong> ${EXP_getExpiringServices(client).join(", ")}</div>
          <div class="col-md-4"><strong>Remaining:</strong> ${EXP_getRemainingDays(client)}</div>
        </div>
      `;
      document.getElementById("viewClientBody").innerHTML = html;

      new bootstrap.Modal(document.getElementById("viewClientModal")).show();
    });
  });

  // SEND
  document.querySelectorAll(".exp-send-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const token = localStorage.getItem("authToken");

      const res = await fetch(`${BASE_URL}/api/clients/${id}/`, {
        headers: { "Authorization": `Token ${token}` }
      });
      const client = await res.json();

      const expiring = EXP_getExpiringServices(client);
      if (!expiring.length) return alert("No expiring service found");

      const sendRes = await fetch(
        `${BASE_URL}/api/send-renewal-mail/${id}/`,
        {
          method: "POST",
          headers: {
            "Authorization": `Token ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ service: expiring[0] })
        }
      );

      if (sendRes.ok) alert(`Mail sent to ${client.email}`);
      else alert("Failed to send email.");
    });
  });
}

// -------------------------------------
// PAGINATION
// -------------------------------------
let EXP_rowsPerPage = 10;

function EXP_paginate(page) {
  const rows = document.querySelectorAll(".table-data tr");
  const total = Math.ceil(rows.length / EXP_rowsPerPage);

  page = Math.max(1, Math.min(page, total));

  rows.forEach((row, i) => {
    const start = (page - 1) * EXP_rowsPerPage;
    const end = page * EXP_rowsPerPage;
    row.style.display = i >= start && i < end ? "" : "none";
  });
}

// -------------------------------------
// CATEGORY (SERVICE) FILTER
// -------------------------------------
function EXP_initCategoryFilter() {
  const btn = document.querySelector(".custom-category");
  if (!btn) return;

  let dropdown = null;

  btn.addEventListener("click", e => {
    e.stopPropagation();

    if (dropdown) {
      dropdown.remove();
      dropdown = null;
      return;
    }

    const html = `
      <ul class="dropdown-menu show" style="position:absolute; z-index:1000;">
        <li><a class="dropdown-item exp-opt" data-service="all">All Status</a></li>
        <li><a class="dropdown-item exp-opt" data-service="Domain">Domain</a></li>
        <li><a class="dropdown-item exp-opt" data-service="Server">Server</a></li>
        <li><a class="dropdown-item exp-opt" data-service="Maintenance">Maintenance</a></li>
      </ul>
    `;

    btn.insertAdjacentHTML("afterend", html);
    dropdown = btn.nextElementSibling;

    dropdown.querySelectorAll(".exp-opt").forEach(opt => {
      opt.addEventListener("click", () => {
        EXP_currentService = opt.dataset.service;
        btn.innerText = opt.innerText;
        EXP_applyFilters();
        dropdown.remove();
        dropdown = null;
      });
    });
  });

  document.addEventListener("click", () => {
    dropdown?.remove();
    dropdown = null;
  });
}

// -------------------------------------
// EXPORT
// -------------------------------------
document.getElementById("exportBtn")?.addEventListener("click", () => {
  const visibleRows = Array.from(document.querySelectorAll(".table-data tr"))
    .filter(r => r.style.display !== "none");

  if (!visibleRows.length) return alert("No data to export.");

  const data = visibleRows.map(r => {
    const c = r.querySelectorAll("td");
    return {
      "SL No": c[0].innerText,
      "Client Name": c[1].innerText,
      "Email": c[2].innerText,
      "Contact Number": c[3].innerText,
      "Expired Services": c[4].innerText,
      "Remaining": c[5].innerText,
      "Priority": c[6].innerText
    };
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Expiry");
  XLSX.writeFile(wb, "Expiry.xlsx");
});

// -------------------------------------
// FETCH CLIENTS
// -------------------------------------
async function EXP_loadClients() {
  try {
    const token = localStorage.getItem("authToken");

    const res = await fetch(`${BASE_URL}/api/clients/`, {
      headers: { "Authorization": `Token ${token}` }
    });

    if (!res.ok) throw new Error("Failed to load data");

    const all = await res.json();

    EXP_allClients = all.filter(c => EXP_getExpiringServices(c).length > 0);

    EXP_currentFiltered = [...EXP_allClients];

    EXP_initCategoryFilter();
    EXP_applyFilters();

  } catch (e) {
    console.error("Expiry load error:", e);
    alert("Unable to load expiry data.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // -------------------------------------
  // TOKEN CHECK (optional - like project page)
  // -------------------------------------
  const token = localStorage.getItem("authToken");
  if (!token) {
    alert("Session expired. Please log in again.");
    window.location.href = "/";
    return;
  }

  // -------------------------------------
  // SIDEBAR TOGGLE (MOBILE)
  // -------------------------------------
  const sidebar = document.getElementById("sidebar");
  const toggleBtn = document.getElementById("sidebarToggle");
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener("click", () => {
      sidebar.classList.toggle("active");
    });
  }

  // -------------------------------------
  // PROFILE REDIRECT (same as project page)
  // -------------------------------------
  const profileLogo = document.querySelector(".dashboard-head img");
  if (profileLogo) {
    profileLogo.addEventListener("click", () => {
      window.location.href = "/user-profile/";
    });
  }

  // -------------------------------------
  // SIDEBAR ACTIVE HIGHLIGHT
  // -------------------------------------
  const currentPath = window.location.pathname.toLowerCase().replace(/\/$/, "");
  const normalizedCurrent = currentPath.replace(/\.html$/, "");

  document.querySelectorAll(".nav-list .nav-link").forEach(link => {
    const linkHref = link.getAttribute("href").toLowerCase().replace(/\/$/, "");
    const normalizedHref = linkHref.replace(/\.html$/, "");

    if (
      normalizedCurrent === normalizedHref ||
      normalizedCurrent.startsWith(normalizedHref + "/")
    ) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });

  // -------------------------------------
  // Read dashboard filter (?days=5/15/30/60)
  // -------------------------------------
  EXP_initFromQuery();

  // -------------------------------------
  // LOAD EXPIRY DATA
  // -------------------------------------
  EXP_loadClients();
});



})();
