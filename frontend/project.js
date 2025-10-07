// ===================
// Sidebar + Table + API Integration
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

  // ===================
  // Render Table
  // ===================
  function renderTable(projects) {
    tableBody.innerHTML = "";

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

    initViewActions();
    initEditActions();
    initDeleteActions();
  }


const exportBtn = document.getElementById("exportBtn");

exportBtn.addEventListener("click", () => {
  if (!allProjects.length) {
    alert("No clients to export!");
    return;
  }

  // Map data for Excel
  const data = allProjects.map(c => ({
    "Project Name": c.project_name || "-",
    "Person Name": c.person_name || "-",
    "Server Name": c.server_name || "-",
    "Ph.Number": c.contact_number || "-",
    "Email": c.email || "-",
    "Status": c.status || "-",
    "Description": c.description || "-"
  }));

  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(data);

  // Create workbook and append
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "projects");

  // Download Excel file
  XLSX.writeFile(wb, "Project_List.xlsx");
});


  // ===================
  // Load Projects
  // ===================
  async function loadProjects() {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/projects/");
      if (!res.ok) throw new Error("Failed to fetch projects");

      allProjects = await res.json();

      // sort latest first
      allProjects.sort((a, b) => b.id - a.id);

      renderTable(allProjects);
      initSearchAndPagination();
      initCategoryFilter();
    } catch (err) {
      console.error("Error loading projects:", err);
    }
  }

  // ===================
  // Edit Button Action
  // ===================
  function initEditActions() {
    document.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const projectId = btn.getAttribute("data-id");

        try {
          const res = await fetch(`http://127.0.0.1:8000/api/projects/${projectId}/`);
          if (!res.ok) throw new Error("Failed to fetch project details");

          const project = await res.json();
          sessionStorage.setItem("editProject", JSON.stringify(project));
          window.location.href = "addproject.html";
        } catch (error) {
          console.error(error);
          alert("Failed to load project for editing.");
        }
      });
    });
  }

  // ===================
  // View Button Action
  // ===================
  function initViewActions() {
    document.querySelectorAll(".view-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const projectId = btn.getAttribute("data-id");

        try {
          const res = await fetch(`http://127.0.0.1:8000/api/projects/${projectId}/`);
          if (!res.ok) throw new Error("Failed to fetch project details");

          const project = await res.json();

                    const html = `
            <div class="container-fluid">
              <div class="row g-3">
                <div class="col-md-4 text-wrap"><strong>Project Name:</strong> ${project.project_name || "-"}</div>
                <div class="col-md-4 text-wrap"><strong>Person Name:</strong> ${project.person_name || "-"}</div>
                <div class="col-md-4 text-wrap"><strong>Server Name:</strong> ${project.server_name || "-"}</div>

                <div class="col-md-4 text-wrap"><strong>Ph.Number:</strong> ${project.contact_number || "-"}</div>
                <div class="col-md-4 text-wrap"><strong>Email:</strong> <span class="d-inline-block text-break">${project.email || "-"}</span></div>
                <div class="col-md-4 text-wrap"><strong>Status:</strong> ${project.status || "-"}</div>

                <div class="col-12 text-wrap"><strong>Description:</strong> ${project.description || "-"}</div>
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
  }

  // ===================
  // Delete Button Action
  // ===================
  function initDeleteActions() {
    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const projectId = btn.getAttribute("data-id");
        if (!confirm("Are you sure you want to delete this project?")) return;

        try {
          const res = await fetch(`http://127.0.0.1:8000/api/projects/${projectId}/`, {
            method: "DELETE",
          });

          if (res.ok) {
            alert("Project deleted successfully!");
            await loadProjects();
          } else {
            alert("Failed to delete project.");
          }
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

    function searchTable() {
      const term = searchInput.value.toLowerCase().trim();
      const filtered = allProjects.filter(c =>
      (c.company_name && c.company_name.toLowerCase().includes(term)) ||
      (c.person_name && c.person_name.toLowerCase().includes(term)) ||
      (c.email && c.email.toLowerCase().includes(term)) ||
      (c.status && c.status.toLowerCase().includes(term))
      );

      renderTable(filtered);
      initActions();
      paginate(1);
    }

    searchBtn?.addEventListener("click", searchTable);
    searchInput?.addEventListener("keyup", (e) => { if (e.key === "Enter") searchTable(); });
    resetBtn?.addEventListener("click", () => { searchInput.value = ""; renderTable(allProjects); initActions(); paginate(1); });

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
  // Status Category Filter
  // ===================
  function initCategoryFilter() {
    const categoryBtn = document.querySelector(".custom-category");
    if (!categoryBtn) return;

    const statuses = [...new Set(allProjects.map((p) => p.status).filter(Boolean))];

    let dropdownHtml = `
      <ul class="dropdown-menu show" style="position:absolute; z-index:1000;">
        <li><a class="dropdown-item category-option" data-status="all">All Status</a></li>
        ${statuses
          .map(
            (st) =>
              `<li><a class="dropdown-item category-option" data-status="${st}">${st}</a></li>`
          )
          .join("")}
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

        dropdown.querySelectorAll(".category-option").forEach((opt) => {
          opt.addEventListener("click", () => {
            const status = opt.getAttribute("data-status");

            if (status === "all") {
              renderTable(allProjects);
            } else {
              const filtered = allProjects.filter((p) => p.status === status);
              renderTable(filtered);
            }
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
  // Load Projects on Page Ready
  // ===================
  await loadProjects();
});
