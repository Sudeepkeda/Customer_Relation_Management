// ===================
// Expiry.js - Expired Clients Management (Updated)
// ===================

let allClients = [];

// ===================
// Sidebar + Table + API Integration
// ===================
document.addEventListener("DOMContentLoaded", async () => {
  // Sidebar Active Menu Highlight
  const currentPage = window.location.pathname.split("/").pop().toLowerCase();
  document.querySelectorAll(".nav-list .nav-link").forEach(link => {
    const linkPage = link.getAttribute("href").toLowerCase();
    link.classList.toggle("active", linkPage === currentPage);
  });

  // Sidebar Toggle (Mobile)
  const sidebar = document.getElementById("sidebar");
  const toggleBtn = document.getElementById("sidebarToggle");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => sidebar.classList.toggle("active"));
  }

  // Fetch Clients
  try {
    const res = await fetch("http://127.0.0.1:8000/api/clients/");
    if (!res.ok) throw new Error("Failed to fetch clients");
    allClients = await res.json();

    // Filter clients with at least one expired or expiring service
    const expiredClients = allClients.filter(c => getExpiryStatus(c).length > 0);

    renderTable(expiredClients);
    initActions();
    initSearchAndPagination();
    initCategoryFilter();
  } catch (err) {
    console.error("Error loading clients:", err);
  }
});

// ===================
// Helpers
// ===================
function daysUntil(dateStr) {
  if (!dateStr) return Infinity;
  const today = new Date();
  const expiry = new Date(dateStr);
  return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
}

function isExpiredDate(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

// Returns array of services that are expired or expiring within 60 days
function getExpiryStatus(client) {
  const services = [
    { name: "Domain", date: client.domain_end_date, short: "D" },
    { name: "Server", date: client.server_end_date, short: "S" },
    { name: "Maintenance", date: client.maintenance_end_date, short: "M" },
  ];

  const expiredServices = services
    .filter(s => s.date && daysUntil(s.date) <= 60)
    .map(s => s.name);

  return expiredServices; // Only names like ["Domain", "Maintenance"]
}

// Returns string like D-10, M-5, S-0 but only for services <=60 days remaining
function getRemainingDays(client) {
  const services = [
    { name: "Domain", date: client.domain_end_date, short: "D" },
    { name: "Server", date: client.server_end_date, short: "S" },
    { name: "Maintenance", date: client.maintenance_end_date, short: "M" },
  ];

  const remaining = services
    .filter(s => s.date && daysUntil(s.date) <= 60)
    .map(s => {
      let d = daysUntil(s.date);
      if (d < 0) d = 0; // expired services show as 0
      return `${s.short}-${d}`;
    });

  return remaining.length > 0 ? remaining.join(", ") : "-";
}

// ===================
// Render Table
// ===================
function renderTable(clients) {
  const tableBody = document.querySelector(".table-data");
  tableBody.innerHTML = "";

  clients.forEach((client, index) => {
    const expiredServices = getExpiryStatus(client);
    if (expiredServices.length === 0) return;

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
          <button class="btn btn-sm me-1 view-btn" data-id="${client.id}">
            <img src="images/View.png" alt="View">
          </button>
          <button class="btn btn-sm btn-send" data-id="${client.id}">
            <img src="images/send.png" alt="Send">
          </button>
        </td>
      </tr>
    `;
    tableBody.insertAdjacentHTML("beforeend", row);
  });

  paginate(1); // reset pagination
}

// ===================
// Actions (View and Send Mail)
// ===================
function initActions() {
  document.querySelectorAll(".view-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const res = await fetch(`http://127.0.0.1:8000/api/clients/${id}/`);
      const client = await res.json();

      const details = `
        <p><strong>Client Name:</strong> ${client.person_name || "-"}</p>
        <p><strong>Email:</strong> ${client.email || "-"}</p>
        <p><strong>Contact:</strong> ${client.contact_number || "-"}</p>
        <p><strong>Domain End:</strong> ${client.domain_end_date || "-"}</p>
        <p><strong>Server End:</strong> ${client.server_end_date || "-"}</p>
        <p><strong>Maintenance End:</strong> ${client.maintenance_end_date || "-"}</p>
        <p><strong>Expired Services:</strong> ${getExpiryStatus(client).join(", ")}</p>
        <p><strong>Remaining Days:</strong> ${getRemainingDays(client)}</p>
      `;
      document.getElementById("viewClientBody").innerHTML = details;
      new bootstrap.Modal(document.getElementById("viewClientModal")).show();
    });
  });

  document.querySelectorAll(".btn-send").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const id = btn.dataset.id;

    const clientRes = await fetch(`http://127.0.0.1:8000/api/clients/${id}/`);
    const client = await clientRes.json();

    const services = [
      { name: "Domain", date: client.domain_end_date, short: "D" },
      { name: "Server", date: client.server_end_date, short: "S" },
      { name: "Maintenance", date: client.maintenance_end_date, short: "M" },
    ];

    const expiringServices = services
      .filter(s => s.date && daysUntil(s.date) <= 60)
      .map(s => ({ ...s, remaining: Math.max(daysUntil(s.date), 0) }));

    if (expiringServices.length === 0) {
      alert("No services expiring in ≤60 days for this client.");
      return;
    }

    const nearest = expiringServices.reduce((a, b) => (a.remaining < b.remaining ? a : b));

    try {
      const sendRes = await fetch(`http://127.0.0.1:8000/api/send-renewal-mail/${id}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service: nearest.name })
      });

      if (!sendRes.ok) throw new Error("Failed to send renewal email");

      alert(`✅ Renewal reminder sent for ${nearest.name} to ${client.email}`);
    } catch (err) {
      console.error(err);
      alert("❌ Failed to send renewal email. Check backend logs.");
    }
  });
});


}

// ===================
// Search + Pagination
// ===================
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

function initSearchAndPagination() {
  const searchInput = document.querySelector(".search-div input");
  const searchBtn = document.querySelector(".custom-search");
  const resetBtn = document.querySelector(".custom-reset");
  const pageInput = document.getElementById("pageInput");
  const paginationLinks = document.querySelectorAll(".pagination .page-link");

  function searchTable() {
    const term = searchInput.value.toLowerCase().trim();
    const filtered = allClients
      .filter(c => getExpiryStatus(c) !== "-")
      .filter(c =>
        (c.company_name && c.company_name.toLowerCase().includes(term)) ||
        (c.email && c.email.toLowerCase().includes(term))
      );
    renderTable(filtered);
    initActions();
  }

  if (searchBtn) searchBtn.addEventListener("click", searchTable);
  if (searchInput) searchInput.addEventListener("keyup", e => { if (e.key === "Enter") searchTable(); });
  if (resetBtn) resetBtn.addEventListener("click", () => {
    searchInput.value = "";
    renderTable(allClients.filter(c => getExpiryStatus(c) !== "-"));
    initActions();
  });

  if (pageInput) pageInput.addEventListener("change", () => {
    const val = parseInt(pageInput.value, 10);
    if (!isNaN(val) && val > 0) {
      rowsPerPage = val;
      paginate(1);
    }
  });

  paginationLinks.forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const text = link.innerText.toLowerCase();
      if (text === "previous") paginate(currentPageNumber - 1);
      else if (text === "next") paginate(currentPageNumber + 1);
      else {
        const pageNum = parseInt(text, 10);
        if (!isNaN(pageNum)) paginate(pageNum);
      }
    });
  });
}

// ===================
// Category Filter
// ===================
function initCategoryFilter() {
  const categoryBtn = document.querySelector(".custom-category");
  if (!categoryBtn) return;

  const services = ["Domain", "Server", "Maintenance"];

  let dropdownHtml = `
    <ul class="dropdown-menu show" style="position:absolute; z-index:1000;">
      <li><a class="dropdown-item category-option" data-type="all">All Expired/Expiring</a></li>
      <li><hr class="dropdown-divider"></li>
      ${services.map(s => `<li><a class="dropdown-item category-option" data-type="service" data-value="${s}">${s}</a></li>`).join("")}
    </ul>
  `;

  let dropdown;
  categoryBtn.addEventListener("click", e => {
    e.stopPropagation();
    if (dropdown) {
      dropdown.remove();
      dropdown = null;
    } else {
      categoryBtn.insertAdjacentHTML("afterend", dropdownHtml);
      dropdown = categoryBtn.nextElementSibling;

      dropdown.querySelectorAll(".category-option").forEach(opt => {
        opt.addEventListener("click", () => {
          const type = opt.getAttribute("data-type");
          const value = opt.getAttribute("data-value");

          let filtered = allClients.filter(c => getExpiryStatus(c) !== "-");
          if (type === "service") filtered = filtered.filter(c => getExpiryStatus(c).includes(value));

          renderTable(filtered);
          initActions();
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
