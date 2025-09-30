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

  // ===================
  // Global Variables
  // ===================
  const tableBody = document.querySelector(".table-data");
  let allProjects = []; // store all projects globally

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
            <button class="btn btn-sm view-btn me-1" data-id="${project.id}">
              <img src="images/View.png" alt="View">
            </button>
            <button class="btn btn-sm edit-btn" data-id="${project.id}">
              <img src="images/edit.png" alt="Edit">
            </button>
             <button class="btn btn-sm delete-btn" data-id="${project.id}">
    <img src="images/Delete.png" alt="Delete">
  </button>
          </td>
        </tr>
      `;
      tableBody.insertAdjacentHTML("beforeend", row);
    });

    initViewActions(); // re-init actions after rendering
    initEditActions(); // re-init edit actions
    initDeleteActions(); 
  }

  // ===================
  // Fetch Projects from API
  // ===================
  async function loadProjects() {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/projects/");
      if (!response.ok) throw new Error("Failed to fetch projects");

      allProjects = await response.json();
      renderTable(allProjects);

      initSearchAndPagination();
      initCategoryFilter();
    } catch (err) {
      console.error("Error loading projects:", err);
    }
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

          const modalBody = `
            <p><strong>Project Name:</strong> ${project.project_name || "-"}</p>
            <p><strong>Person Name:</strong> ${project.person_name || "-"}</p>
            <p><strong>Description:</strong> ${project.description || "-"}</p>
            <p><strong>Server Name:</strong> ${project.server_name || "-"}</p>
            <p><strong>Contact Number:</strong> ${project.contact_number || "-"}</p>
            <p><strong>Email:</strong> ${project.email || "-"}</p>
            <p><strong>Status:</strong> ${project.status || "-"}</p>
          `;

          document.getElementById("viewProjectBody").innerHTML = modalBody;
          new bootstrap.Modal(document.getElementById("viewProjectModal")).show();
        } catch (error) {
          console.error(error);
          alert("Failed to load project details.");
        }
      });
    });

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

          // Store project data in localStorage or sessionStorage to prefill form
          sessionStorage.setItem("editProject", JSON.stringify(project));

          // Redirect to addproject.html for editing
          window.location.href = "addproject.html";
        } catch (error) {
          console.error(error);
          alert("Failed to load project for editing.");
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
          await loadProjects(); // reload table
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
      const filtered = allProjects.filter(p =>
        (p.project_name && p.project_name.toLowerCase().includes(term)) ||
        (p.person_name && p.person_name.toLowerCase().includes(term)) ||
        (p.status && p.status.toLowerCase().includes(term)) ||
        (p.email && p.email.toLowerCase().includes(term))
      );
      renderTable(filtered);
    }

    if (searchBtn) searchBtn.addEventListener("click", searchTable);
    if (searchInput) searchInput.addEventListener("keyup", (e) => {
      if (e.key === "Enter") searchTable();
    });
    if (resetBtn) resetBtn.addEventListener("click", () => {
      searchInput.value = "";
      renderTable(allProjects);
    });

    // Pagination
    const pageInput = document.getElementById("pageInput");
    const paginationLinks = document.querySelectorAll(".pagination .page-link");
    let rowsPerPage = 5;
    let currentPage = 1;

    function paginate(page) {
      const rows = Array.from(document.querySelectorAll(".table-data tr"));
      const totalPages = Math.ceil(rows.length / rowsPerPage);
      if (page < 1) page = 1;
      if (page > totalPages) page = totalPages;
      currentPage = page;

      rows.forEach((row, index) => {
        row.style.display =
          index >= (page - 1) * rowsPerPage && index < page * rowsPerPage
            ? ""
            : "none";
      });
    }

    paginate(1);

    if (pageInput) {
      pageInput.addEventListener("change", () => {
        const val = parseInt(pageInput.value, 10);
        if (!isNaN(val) && val > 0) {
          rowsPerPage = val;
          currentPage = 1;
          paginate(currentPage);
        }
      });
    }

    paginationLinks.forEach(link => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const text = link.innerText.toLowerCase();
        if (text === "previous") paginate(currentPage - 1);
        else if (text === "next") paginate(currentPage + 1);
        else {
          const pageNum = parseInt(text, 10);
          if (!isNaN(pageNum)) paginate(pageNum);
        }
      });
    });
  }

  // ===================
  // Category Filter (Project Status)
  // ===================
  function initCategoryFilter() {
    const categoryBtn = document.querySelector(".custom-category");
    if (!categoryBtn) return;

    const statuses = [...new Set(allProjects.map(p => p.status).filter(Boolean))];

    let dropdownHtml = `
      <ul class="dropdown-menu show" style="position:absolute; z-index:1000;">
        <li><a class="dropdown-item category-option" data-status="all">All Status</a></li>
        ${statuses.map(s => `<li><a class="dropdown-item category-option" data-status="${s}">${s}</a></li>`).join("")}
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
            const status = opt.getAttribute("data-status");
            if (status === "all") renderTable(allProjects);
            else renderTable(allProjects.filter(p => p.status === status));
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
  // Load Projects
  // ===================
  await loadProjects();
});
