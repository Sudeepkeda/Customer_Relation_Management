// ===================
// Expiry.js - Expired Clients Management
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

    // Filter clients with at least one expired service
    const expiredClients = allClients.filter(c => getExpiredServices(c) !== "-");

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
function isExpiredDate(dateStr) {
  if (!dateStr) return false;
  const today = new Date().toISOString().split("T")[0];
  return new Date(dateStr) < new Date(today);
}

function getExpiredServices(client) {
  const expired = [];
  if (isExpiredDate(client.domain_end_date)) expired.push("Domain");
  if (isExpiredDate(client.server_end_date)) expired.push("Server");
  if (isExpiredDate(client.maintenance_end_date)) expired.push("Maintenance");
  return expired.length > 0 ? expired.join(", ") : "-";
}

// ===================
// Render Table
// ===================
function renderTable(clients) {
  const tableBody = document.querySelector(".table-data");
  tableBody.innerHTML = "";

  clients.forEach((client, index) => {
    const expiredServices = getExpiredServices(client);
    if (expiredServices === "-") return; // skip non-expired

    const row = `
      <tr>
        <td>${index + 1}</td>
        <td>${client.company_name || "-"}</td>
        <td>${client.email || "-"}</td>
        <td>${client.contact_number || "-"}</td>
        <td>${expiredServices}</td>
        <td>${client.priority || "-"}</td>
        <td>
          <button class="btn btn-sm me-1 view-btn" data-id="${client.id}">
            <img src="images/View.png" alt="View">
          </button>
          <button class="btn btn-sm btn-send" data-id="">
                <img src="images/send.png" alt="Send">
              </button>
        </td>
      </tr>
    `;
    tableBody.insertAdjacentHTML("beforeend", row);
  });

  paginate(1); // reset pagination whenever table is re-rendered
}

// ===================
// Actions (View Only)
// ===================
function initActions() {
  document.querySelectorAll(".view-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const res = await fetch(`http://127.0.0.1:8000/api/clients/${id}/`);
      const client = await res.json();

      const details = `
        <p><strong>Company:</strong> ${client.company_name || "-"}</p>
        <p><strong>Email:</strong> ${client.email || "-"}</p>
        <p><strong>Contact:</strong> ${client.contact_number || "-"}</p>
        <p><strong>Domain End:</strong> ${client.domain_end_date || "-"}</p>
        <p><strong>Server End:</strong> ${client.server_end_date || "-"}</p>
        <p><strong>Maintenance End:</strong> ${client.maintenance_end_date || "-"}</p>
        <p><strong>Expired Services:</strong> ${getExpiredServices(client)}</p>
      `;
      document.getElementById("viewClientBody").innerHTML = details;
      new bootstrap.Modal(document.getElementById("viewClientModal")).show();
    });
  });
}

// ===================
// Search + Pagination (expired only)
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
    const searchTerm = searchInput.value.toLowerCase().trim();
    const filtered = allClients
      .filter(c => getExpiredServices(c) !== "-")
      .filter(c => {
        return (
          (c.company_name && c.company_name.toLowerCase().includes(searchTerm)) ||
          (c.industry && c.industry.toLowerCase().includes(searchTerm)) ||
          (c.person_name && c.person_name.toLowerCase().includes(searchTerm)) ||
          (c.email && c.email.toLowerCase().includes(searchTerm))
        );
      });

    renderTable(filtered);
    initActions();
  }

  if (searchBtn) searchBtn.addEventListener("click", searchTable);
  if (searchInput) {
    searchInput.addEventListener("keyup", (e) => { if (e.key === "Enter") searchTable(); });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      searchInput.value = "";
      renderTable(allClients.filter(c => getExpiredServices(c) !== "-"));
      initActions();
    });
  }

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
// ===================
// Category Filter (Expired Services Only)
// ===================
function initCategoryFilter() {
  const categoryBtn = document.querySelector(".custom-category");
  if (!categoryBtn) return;

  const services = ["Domain", "Server", "Maintenance"];

  let dropdownHtml = `
    <ul class="dropdown-menu show" style="position:absolute; z-index:1000;">
      <li><a class="dropdown-item category-option" data-type="all">All Expired</a></li>
      <li><hr class="dropdown-divider"></li>
      ${services.map(s => `<li><a class="dropdown-item category-option" data-type="service" data-value="${s}">${s}</a></li>`).join("")}
    </ul>
  `;

  let dropdown;
  categoryBtn.addEventListener("click", (e) => {
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

          let filtered = allClients.filter(c => getExpiredServices(c) !== "-");

          if (type === "service") {
            filtered = filtered.filter(c => getExpiredServices(c).includes(value));
          }

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
