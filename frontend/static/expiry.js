// ===============================
// EXPIRY PGE 
// ===============================
(function () {

const BASE_URL = window.location.origin;

let EXP_allClients = [];
let EXP_currentFiltered = [];
let EXP_currentService = "all";
/** From ?days=5|15|30|60 — null means “any expiry within 60 days” (not a bucket). */
let EXP_band = null;

// -------------------------------------
// HELPERS
// -------------------------------------
/** Whole calendar days from today until end date (negative = already expired). */
function EXP_daysUntilEnd(endDateStr) {
  if (!endDateStr) return null;
  const end = new Date(endDateStr);
  const today = new Date();
  end.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.ceil((end - today) / (1000 * 60 * 60 * 24));
}

function EXP_leftMatchesBand(left, band) {
  if (left === null || !Number.isFinite(left)) return false;
  if (band.lte !== undefined) return left <= band.lte;
  return left >= band.min && left <= band.max;
}

/** Client has at least one end date with remaining days in this band (or default ≤60). */
function EXP_clientHasMatchingEnd(c, band) {
  const ends = [c.domain_end_date, c.server_end_date, c.maintenance_end_date];
  return ends.some((end) => {
    const left = EXP_daysUntilEnd(end);
    if (left === null || !Number.isFinite(left)) return false;
    return EXP_leftMatchesBand(left, band);
  });
}

/** Any service ending within 60 days (or already expired). */
function EXP_clientHasExpiryWithin60(c) {
  const ends = [c.domain_end_date, c.server_end_date, c.maintenance_end_date];
  return ends.some((end) => {
    const left = EXP_daysUntilEnd(end);
    return left !== null && Number.isFinite(left) && left <= 60;
  });
}

function EXP_getExpiringServices(client) {
  const services = [
    { name: "Domain", end: client.domain_end_date },
    { name: "Server", end: client.server_end_date },
    { name: "Maintenance", end: client.maintenance_end_date }
  ];

  return services
    .filter((s) => {
      if (!s.end) return false;
      const left = EXP_daysUntilEnd(s.end);
      if (left === null || !Number.isFinite(left)) return false;
      if (EXP_band) return EXP_leftMatchesBand(left, EXP_band);
      return left <= 60;
    })
    .map((s) => s.name);
}

function EXP_getRemainingDays(client) {
  const list = [
    { short: "D", end: client.domain_end_date },
    { short: "S", end: client.server_end_date },
    { short: "M", end: client.maintenance_end_date }
  ];

  const parts = list
    .filter((s) => s.end)
    .map((s) => {
      const left = EXP_daysUntilEnd(s.end);
      return { short: s.short, left };
    })
    .filter((s) => s.left !== null && Number.isFinite(s.left))
    .filter((s) => {
      if (EXP_band) return EXP_leftMatchesBand(s.left, EXP_band);
      return s.left <= 60;
    })
    .map((s) => {
      if (s.left < 0) return `${s.short}-Expire`;
      if (s.left === 0) return `${s.short}-Expire`;
      return `${s.short}-${s.left}`;
    });
  return parts.length ? parts.join(", ") : "-";
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

  if (EXP_band) {
    filtered = filtered.filter((c) => EXP_clientHasMatchingEnd(c, EXP_band));
  }

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
}

// -------------------------------------
// Read query params (days) on load
// -------------------------------------
function EXP_initFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const daysParam = params.get("days");
  if (!daysParam) {
    EXP_band = null;
    return;
  }
  const n = parseInt(daysParam, 10);
  if (isNaN(n) || n <= 0) {
    EXP_band = null;
    return;
  }
  if (n === 5) EXP_band = { lte: 5 };
  else if (n === 15) EXP_band = { min: 6, max: 15 };
  else if (n === 30) EXP_band = { min: 16, max: 30 };
  else if (n === 60) EXP_band = { min: 31, max: 60 };
  else EXP_band = null;
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
        <div class="row g-2 enquiry-details">
          <div class="col-md-4"><div class="detail-label">Name</div><div class="detail-value">${client.person_name || "-"}</div></div>
          <div class="col-md-4 text-break"><div class="detail-label">Email</div><div class="detail-value">${client.email || "-"}</div></div>
          <div class="col-md-4"><div class="detail-label">Contact</div><div class="detail-value">${client.contact_number || "-"}</div></div>
          <div class="col-md-4"><div class="detail-label">Domain End</div><div class="detail-value">${client.domain_end_date || "-"}</div></div>
          <div class="col-md-4"><div class="detail-label">Server End</div><div class="detail-value">${client.server_end_date || "-"}</div></div>
          <div class="col-md-4"><div class="detail-label">Maintenance End</div><div class="detail-value">${client.maintenance_end_date || "-"}</div></div>
          <div class="col-md-4"><div class="detail-label">Expiring</div><div class="detail-value">${EXP_getExpiringServices(client).join(", ") || "-"}</div></div>
          <div class="col-md-4"><div class="detail-label">Remaining</div><div class="detail-value">${EXP_getRemainingDays(client) || "-"}</div></div>
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

      if (!confirm(`Send renewal email to ${client.email || "this client"}?`)) return;

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

      if (sendRes.ok) alert(`Mail sent successfully to ${client.email || "recipient"}.`);
      else alert("Failed to send email.");
    });
  });
}

// -------------------------------------
// PAGINATION (disabled — list all rows)
// -------------------------------------
// let EXP_rowsPerPage = 10;
// function EXP_paginate(page) { ... }

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

    EXP_initFromQuery();

    EXP_allClients = all.filter((c) => EXP_clientHasExpiryWithin60(c));

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
  // LOAD EXPIRY DATA (reads ?days= band inside load)
  // -------------------------------------
  EXP_loadClients();
});



})();
