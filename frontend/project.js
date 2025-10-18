// ===================
// Sidebar + Table + API Integration for Projects
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

  const profileLogo = document.querySelector(".dashboard-head img");
  if (profileLogo) {
    profileLogo.addEventListener("click", () => {
      window.location.href = "profile.html";
    });
  }

  const tableBody = document.querySelector(".table-data");
  let allProjects = [];
  let currentFiltered = [];
  let currentStatus = "all";

  // ===================
  // Render Table
  // ===================
  function renderTable(projects) {
    tableBody.innerHTML = "";

    if (!projects.length) {
      tableBody.innerHTML = `<tr><td colspan="7" class="text-center">No projects found</td></tr>`;
      return;
    }

    projects.forEach((project, index) => {
      const row = `
        <tr>
          <td>${index + 1}</td>
          <td>${project.project_name || "-"}</td>
          <td>${project.person_name || "-"}</td>
          <td>${project.status || "-"}</td>
          <td>${project.contact_number || "-"}</td>
          <td>${project.email || "-"}</td>
          <td>
            <div class="d-flex flex-nowrap">
              <button class="btn btn-sm view-btn me-1" data-id="${project.id}">
                <img src="images/View.png" alt="View">
              </button>
              <button class="btn btn-sm edit-btn" data-id="${project.id}">
                <img src="images/Edit.png" alt="Edit">
              </button>
              <button class="btn btn-sm delete-btn" data-id="${project.id}">
                <img src="images/Delete.png" alt="Delete">
              </button>
            </div>
          </td>
        </tr>
      `;
      tableBody.insertAdjacentHTML("beforeend", row);
    });

    initActions();
  }

  // ===================
  // Fetch Projects
  // ===================
  async function loadProjects() {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/projects/");
      if (!res.ok) throw new Error("Failed to fetch projects");
      allProjects = await res.json();
      allProjects.sort((a, b) => b.id - a.id);

      currentFiltered = [...allProjects];
      initSearchAndPagination();
      initStatusFilter();
      applyFilters();
    } catch (err) {
      console.error("Error loading projects:", err);
      tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Failed to load projects.</td></tr>`;
    }
  }

  // ===================
  // Apply Filters (Date + Search + Status)
  // ===================
  function applyFilters() {
    const searchInput = document.querySelector(".search-div input");
    const term = searchInput ? searchInput.value.toLowerCase().trim() : "";
    let filtered = [...allProjects];

    // Search Filter
    if (term) {
      filtered = filtered.filter(
        (p) =>
          (p.project_name && p.project_name.toLowerCase().includes(term)) ||
          (p.person_name && p.person_name.toLowerCase().includes(term)) ||
          (p.email && p.email.toLowerCase().includes(term)) ||
          (p.status && p.status.toLowerCase().includes(term))
      );
    }

    // Date Filter
    const fromDate = document.getElementById("fromDate")?.value;
    const toDate = document.getElementById("toDate")?.value;

    if (fromDate) {
      const fromD = new Date(fromDate);
      filtered = filtered.filter((p) => {
        if (!p.date) return false;
        return new Date(p.date) >= fromD;
      });
    }

    if (toDate) {
      const toD = new Date(toDate + "T23:59:59");
      filtered = filtered.filter((p) => {
        if (!p.date) return false;
        return new Date(p.date) <= toD;
      });
    }

    // Status Filter
    if (currentStatus !== "all") {
      filtered = filtered.filter((p) => p.status === currentStatus);
    }

    currentFiltered = filtered;
    renderTable(filtered);
    paginate(1);
  }

  // ===================
  // View / Edit / Delete Actions
  // ===================
  function initActions() {
    // View
    document.querySelectorAll(".view-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        try {
          const res = await fetch(`http://127.0.0.1:8000/api/projects/${id}/`);
          if (!res.ok) throw new Error("Failed to fetch project");
          const project = await res.json();

          const html = `
            <div class="container-fluid">
              <div class="row g-3">
                <div class="col-md-4"><strong>Project Name:</strong> ${project.project_name || "-"}</div>
                <div class="col-md-4"><strong>Person Name:</strong> ${project.person_name || "-"}</div>
                <div class="col-md-4"><strong>Server Name:</strong> ${project.server_name || "-"}</div>
                <div class="col-md-4"><strong>Contact:</strong> ${project.contact_number || "-"}</div>
                <div class="col-md-4 text-break"><strong>Email:</strong> ${project.email || "-"}</div>
                <div class="col-md-4"><strong>Status:</strong> ${project.status || "-"}</div>
                <div class="col-12"><strong>Description:</strong> ${project.description || "-"}</div>
              </div>
            </div>
          `;
          document.getElementById("viewProjectBody").innerHTML = html;
          new bootstrap.Modal(document.getElementById("viewProjectModal")).show();
        } catch (error) {
          console.error(error);
          alert("Failed to load project details.");
        }
      });
    });

    // Edit
    document.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        const res = await fetch(`http://127.0.0.1:8000/api/projects/${id}/`);
        const project = await res.json();
        sessionStorage.setItem("editProject", JSON.stringify(project));
        window.location.href = "addproject.html";
      });
    });

    // Delete
    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm("Are you sure you want to delete this project?")) return;
        const id = btn.dataset.id;
        try {
          const res = await fetch(`http://127.0.0.1:8000/api/projects/${id}/`, { method: "DELETE" });
          if (res.ok) {
            alert("Deleted successfully!");
            await loadProjects();
          } else alert("Failed to delete.");
        } catch (error) {
          console.error("Delete error:", error);
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
      if (searchInput) searchInput.value = "";
      document.getElementById("fromDate").value = "";
      document.getElementById("toDate").value = "";
      currentStatus = "all";
      document.querySelector(".custom-category").innerText = "All Status";
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

    document.getElementById("pageInput")?.addEventListener("input", (e) => {
      const val = parseInt(e.target.value, 10);
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
  // Status Dropdown Filter
  // ===================
  function initStatusFilter() {
    const statusBtn = document.querySelector(".custom-category");
    if (!statusBtn) return;

    const statuses = [...new Set(allProjects.map((p) => p.status).filter(Boolean))];
    const dropdownHtml = `
      <ul class="dropdown-menu show" style="position:absolute; z-index:1000;">
        <li><a class="dropdown-item status-option" data-status="all">All Status</a></li>
        ${statuses.map((s) => `<li><a class="dropdown-item status-option" data-status="${s}">${s}</a></li>`).join("")}
      </ul>
    `;

    let dropdown = null;
    statusBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (dropdown) {
        dropdown.remove();
        dropdown = null;
        return;
      }
      statusBtn.insertAdjacentHTML("afterend", dropdownHtml);
      dropdown = statusBtn.nextElementSibling;

      dropdown.querySelectorAll(".status-option").forEach((opt) => {
        opt.addEventListener("click", () => {
          currentStatus = opt.dataset.status;
          statusBtn.innerText = opt.innerText;
          applyFilters();
          dropdown.remove();
          dropdown = null;
        });
      });
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
  const exportBtn = document.getElementById("exportBtn");
  exportBtn.addEventListener("click", () => {
    const visibleRows = Array.from(document.querySelectorAll(".table-data tr")).filter(
      (row) => row.style.display !== "none"
    );

    if (!visibleRows.length) {
      alert("No data to export!");
      return;
    }

    const data = visibleRows.map((row) => {
      const cells = row.querySelectorAll("td");
      return {
        "SL No": cells[0]?.innerText || "",
        "Project Name": cells[1]?.innerText || "",
        "Person Name": cells[2]?.innerText || "",
        "Status": cells[3]?.innerText || "",
        "Contact Number": cells[4]?.innerText || "",
        "Email": cells[5]?.innerText || "",
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Projects");
    XLSX.writeFile(wb, "Filtered_Projects.xlsx");
  });

  // ===================
  // Load all on page ready
  // ===================
  await loadProjects();
});
