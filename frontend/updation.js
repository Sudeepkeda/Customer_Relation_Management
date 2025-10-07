// ===================
// Global Variables
// ===================
let allUpdations = []; // store all records globally
let rowsPerPage = 10;
let currentPage = 1;

// ===================
// Load and Render Updations
// ===================
async function loadProjects() {
  try {
    const res = await fetch("http://127.0.0.1:8000/api/updations/");
    if (!res.ok) throw new Error("Failed to load updations");

    allUpdations = await res.json();
    renderTable(allUpdations);
    paginate(1);
    initStatusFilter();
    initSearch();
  } catch (error) {
    console.error("Load error:", error);
    const tableBody = document.querySelector(".table-data");
    tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Failed to load records</td></tr>`;
  }
}

// ===================
// Render Table
// ===================
function renderTable(data) {
  const tableBody = document.querySelector(".table-data");
  tableBody.innerHTML = "";

  if (!data.length) {
    tableBody.innerHTML = `<tr><td colspan="6" class="text-center">No records found</td></tr>`;
    return;
  }

  data.forEach((upd, index) => {
    const row = `
      <tr>
        <td>${index + 1}</td>
        <td>${upd.client_name}</td>
        <td>${upd.project_name}</td>
        <td>${upd.status}</td>
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

  attachRowEvents();
}

// ===================
// Attach Action Events
// ===================
function attachRowEvents() {
  document.querySelectorAll(".view-btn").forEach(btn =>
    btn.addEventListener("click", () => handleView(btn.dataset.id))
  );
  document.querySelectorAll(".edit-btn").forEach(btn =>
    btn.addEventListener("click", () => handleEdit(btn.dataset.id))
  );
  document.querySelectorAll(".delete-btn").forEach(btn =>
    btn.addEventListener("click", () => handleDelete(btn.dataset.id))
  );
}

// ===================
// VIEW FUNCTION
// ===================
async function handleView(id) {
  try {
    const res = await fetch(`http://127.0.0.1:8000/api/updations/${id}/`);
    if (!res.ok) throw new Error("Failed to fetch record");
    const upd = await res.json();

    const modalBody = document.getElementById("viewClientBody");
    modalBody.innerHTML = `
      <div class="container-fluid">
        <div class="row g-3">
          <div class="col-md-4"><strong>Client Name:</strong> ${upd.client_name}</div>
          <div class="col-md-4"><strong>Project Name:</strong> ${upd.project_name}</div>
          <div class="col-md-4"><strong>Status:</strong> ${upd.status}</div>
          <div class="col-md-4"><strong>Created At:</strong> ${new Date(upd.created_at).toLocaleString()}</div>
          <div class="col-12"><strong>Description:</strong><br>${upd.description || "-"}</div>
        </div>
      </div>
    `;
    new bootstrap.Modal(document.getElementById("viewClientModal")).show();
  } catch (error) {
    console.error("View error:", error);
    alert("Failed to load record details");
  }
}

// ===================
// EDIT FUNCTION
// ===================
function handleEdit(id) {
  window.location.href = `addupdation.html?edit=${id}`;
}

// ===================
// DELETE FUNCTION
// ===================
async function handleDelete(id) {
  if (!confirm("Are you sure you want to delete this record?")) return;
  try {
    const res = await fetch(`http://127.0.0.1:8000/api/updations/${id}/`, {
      method: "DELETE",
    });
    if (res.status === 204 || res.ok) {
      alert("Record deleted successfully!");
      loadProjects();
    } else {
      alert("Error deleting record.");
    }
  } catch (error) {
    console.error("Delete error:", error);
    alert("Something went wrong!");
  }
}

// ===================
// PAGINATION SYSTEM
// ===================
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

// ===================
// SEARCH FUNCTION
// ===================
function initSearch() {
  const searchInput = document.querySelector(".search-div input");
  const searchBtn = document.querySelector(".custom-search");
  const resetBtn = document.querySelector(".custom-reset");

  function searchTable() {
    const term = searchInput.value.toLowerCase().trim();
    const filtered = allUpdations.filter(u =>
      (u.client_name && u.client_name.toLowerCase().includes(term)) ||
      (u.project_name && u.project_name.toLowerCase().includes(term)) ||
      (u.status && u.status.toLowerCase().includes(term)) ||
      (u.description && u.description.toLowerCase().includes(term))
    );
    renderTable(filtered);
    attachRowEvents();
    paginate(1);
  }

  searchBtn?.addEventListener("click", searchTable);
  searchInput?.addEventListener("keyup", (e) => { if (e.key === "Enter") searchTable(); });
  resetBtn?.addEventListener("click", () => {
    searchInput.value = "";
    renderTable(allUpdations);
    attachRowEvents();
    paginate(1);
  });
}

// ===================
// STATUS FILTER
// ===================
function initStatusFilter() {
  const statusBtn = document.querySelector(".custom-category");
  if (!statusBtn) return;

  const statuses = [...new Set(allUpdations.map(u => u.status).filter(Boolean))];
  let dropdownHtml = `
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
          const status = opt.dataset.status;
          const filtered = status === "all" ? allUpdations : allUpdations.filter(u => u.status === status);
          renderTable(filtered);
          attachRowEvents();
          paginate(1);
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
// INIT ON DOM CONTENT LOADED
// ===================
document.addEventListener("DOMContentLoaded", () => {
  // Sidebar Active Menu Highlight
  const currentPage = window.location.pathname.split("/").pop().toLowerCase();
  const navLinks = document.querySelectorAll(".nav-list .nav-link");
  navLinks.forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href").toLowerCase() === currentPage);
  });

  const profileLogo = document.querySelector(".dashboard-head img");
  if (profileLogo) {
    profileLogo.addEventListener("click", () => {
      window.location.href = "profile.html";
    });
  }
  
  // Sidebar Toggle
  const sidebar = document.getElementById("sidebar");
  const toggleBtn = document.getElementById("sidebarToggle");
  if (toggleBtn) toggleBtn.addEventListener("click", () => sidebar.classList.toggle("active"));

  // Load data
  loadProjects();

  // Pagination inputs
  const pageInput = document.getElementById("pageInput");
  pageInput?.addEventListener("input", () => {
    const val = parseInt(pageInput.value.trim(), 10);
    if (!isNaN(val) && val > 0) {
      rowsPerPage = val;
      paginate(1);
    }
  });

  // Pagination links
  document.querySelectorAll(".pagination .page-link").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const text = link.innerText.toLowerCase();
      if (text === "previous") paginate(currentPage - 1);
      else if (text === "next") paginate(currentPage + 1);
      else if (!isNaN(parseInt(text))) paginate(parseInt(text));
    });
  });
});
