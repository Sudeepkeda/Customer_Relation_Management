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

  const tableBody = document.querySelector(".table-data");
  let allProjects = [];

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

    initViewActions();
    initEditActions();
    initDeleteActions();
  }

  // ===================
  // Load + Filter Projects
  // ===================
  async function loadProjects() {
  try {
    const res = await fetch("http://127.0.0.1:8000/api/projects/");
    if (!res.ok) throw new Error("Failed to fetch projects");

    allProjects = await res.json();

    // 🔹 Handle query string filter
    const urlParams = new URLSearchParams(window.location.search);
    const filter = urlParams.get("filter"); // "inprogress" or "all"

    let filteredProjects = allProjects;
    if (filter === "inprogress") {
      filteredProjects = allProjects.filter(
        p => p.status?.toLowerCase() === "in progress"
      );
    } else if (filter === "all") {
      filteredProjects = allProjects; // just to be explicit
    }

    renderTable(filteredProjects);
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

        // Store project data in sessionStorage to prefill form
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
// View Button Action (optional, if needed)
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
  // Load Projects on Page Ready
  // ===================
  await loadProjects();
});
