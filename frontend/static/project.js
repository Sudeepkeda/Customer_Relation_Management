// =====================================
// Projects Listing Page  
// =====================================
document.addEventListener("DOMContentLoaded", async () => {

  const BASE_URL = "https://crm.design-bharat.com";

  const token = localStorage.getItem("authToken");

  // Redirect if no token
  if (!token) {
   // alert("Session expired. Please log in again.");
    window.location.href = "/";
    return;
  }

  // =================================================
  // Sidebar Active Menu Highlight
  // =================================================
  const currentPath = window.location.pathname.toLowerCase().replace(/\/$/, "");
  const normalizedCurrent = currentPath.replace(/\.html$/, "");

  document.querySelectorAll(".nav-list .nav-link").forEach((link) => {
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

  // =================================================
  // Sidebar Toggle
  // =================================================
  const sidebar = document.getElementById("sidebar");
  const toggleBtn = document.getElementById("sidebarToggle");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      sidebar.classList.toggle("active");
    });
  }

  // =================================================
  // Profile redirect
  // =================================================
  const profileLogo = document.querySelector(".dashboard-head img");
  if (profileLogo) {
    profileLogo.addEventListener("click", () => {
      window.location.href = "/user-profile/";
    });
  }

  // =================================================
  // Variables
  // =================================================
  const tableBody = document.querySelector(".table-data");
  let allProjects = [];
  let currentFiltered = [];
  let currentStatus = "all";
  

  const urlFilter = new URLSearchParams(window.location.search).get("filter");

let lockedStatus = null;

if (urlFilter) {
  const f = urlFilter.toLowerCase().replace(/\s+/g, "");

  if (f === "active") currentStatus = "Active";
  else if (f === "inactive") currentStatus = "Inactive";
  else if (f === "all") currentStatus = "all";
  else currentStatus = urlFilter;

  if (currentStatus !== "all") {
    lockedStatus = currentStatus;
  }
}

  // =================================================
  // Fetch Projects
  // =================================================
  async function loadProjects() {
    try {
      const res = await fetch(`${BASE_URL}/api/projects/`, {
        headers: {
          "Authorization": token.startsWith("Token") ? token : "Token " + token,
          "Content-Type": "application/json",
        },
      });

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

  // =================================================
  // Render Table
  // =================================================
  function renderTable(projects) {
    tableBody.innerHTML = "";

    if (!projects.length) {
      tableBody.innerHTML = `<tr><td colspan="7" class="text-center">No projects found</td></tr>`;
      return;
    }

    projects.forEach((p, index) => {
      const row = `
        <tr>
          <td>${index + 1}</td>
          <td>${p.project_name || "-"}</td>
          <td>${p.person_name || "-"}</td>
          <td>${p.status || "-"}</td>
          <td>${p.contact_number || "-"}</td>
          <td>${p.email || "-"}</td>
          <td>
            <div class="d-flex flex-nowrap">
              <button class="btn btn-sm me-1 view-btn" data-id="${p.id}">
                <img src="/static/images/View.png" alt="View">
              </button>
              <button class="btn btn-sm me-1 edit-btn" data-id="${p.id}">
                <img src="/static/images/Edit.png" alt="Edit">
              </button>
              <button class="btn btn-sm delete-btn" data-id="${p.id}">
                <img src="/static/images/Delete.png" alt="Delete">
              </button>
            </div>
          </td>
        </tr>
      `;
      tableBody.insertAdjacentHTML("beforeend", row);
    });

    initActions();
  }

  // =================================================
  // Apply Filters (Search + Date + Status)
  // =================================================
  function applyFilters() {
    const term = document.querySelector(".search-div input")?.value.toLowerCase().trim() || "";
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
      filtered = filtered.filter((p) => p.date && new Date(p.date) >= new Date(fromDate));
    }

    if (toDate) {
      const toD = new Date(toDate + "T23:59:59");
      filtered = filtered.filter((p) => p.date && new Date(p.date) <= toD);
    }

    // Status Filter
    const normalize = (s) => (s || "").toLowerCase().replace(/\s+/g, "");

    const statusToApply = lockedStatus || currentStatus;

    if (statusToApply !== "all") {
    filtered = filtered.filter(
    (p) => normalize(p.status) === normalize(statusToApply)
    );
   }

    currentFiltered = filtered;
    renderTable(filtered);
    paginate(1);
  }

  // =================================================
  // View / Edit / Delete Actions
  // =================================================
  function initActions() {
    // VIEW
    document.querySelectorAll(".view-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;

        try {
          const res = await fetch(`${BASE_URL}/api/projects/${id}/`, {
            headers: {
              "Authorization": token.startsWith("Token") ? token : "Token " + token
            }
          });
          if (!res.ok) throw new Error("Failed to fetch project");

          const p = await res.json();

          document.getElementById("viewProjectBody").innerHTML = `
            <div class="container-fluid">
              <div class="row g-3">
                <div class="col-md-4"><strong>Project Name:</strong> ${p.project_name || "-"}</div>
                <div class="col-md-4"><strong>Person Name:</strong> ${p.person_name || "-"}</div>
                <div class="col-md-4"><strong>Server Name:</strong> ${p.server_name || "-"}</div>
                <div class="col-md-4"><strong>Contact:</strong> ${p.contact_number || "-"}</div>
                <div class="col-md-4 text-break"><strong>Email:</strong> ${p.email || "-"}</div>
                <div class="col-md-4"><strong>Status: </strong>${p.status || "-"}</div>
                <div class="col-12"><strong>Description:</strong> ${p.description || "-"}</div>
              </div>
            </div>
          `;
          new bootstrap.Modal(document.getElementById("viewProjectModal")).show();

        } catch (err) {
          console.error(err);
          //alert("Failed to load project details.");
        }
      });
    });

    // EDIT
    document.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;

        const res = await fetch(`${BASE_URL}/api/projects/${id}/`, {
          headers: {
            "Authorization": token.startsWith("Token") ? token : "Token " + token
          }
        });

        const p = await res.json();
        sessionStorage.setItem("editProject", JSON.stringify(p));
        window.location.href = "/projects/add/";
      });
    });

    // DELETE
    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm("Are you sure you want to delete this project?")) return;

        try {
        const res = await fetch(`${BASE_URL}/api/projects/${btn.dataset.id}/`, {
            method: "DELETE",
            headers: {
              "Authorization": token.startsWith("Token") ? token : "Token " + token
            }
          });

          if (res.ok) {
            //alert("Project deleted successfully!");
            await loadProjects();
          } else {
           // alert("Failed to delete project.");
          }
        } catch (err) {
          console.error(err);
          //alert("Server error while deleting.");
        }
      });
    });
  }

  // =================================================
  // Search + Pagination
  // =================================================
  function initSearchAndPagination() {
    const searchInput = document.querySelector(".search-div input");
    const resetBtn = document.querySelector(".custom-reset");

    searchInput?.addEventListener("keyup", (e) => e.key === "Enter" && applyFilters());
    document.querySelector(".custom-search")?.addEventListener("click", applyFilters);

    resetBtn?.addEventListener("click", () => {
      searchInput.value = "";
      document.getElementById("fromDate").value = "";
      document.getElementById("toDate").value = "";
      currentStatus = "all";
      document.querySelector(".custom-category").innerText = "All Status";
      applyFilters();
    });

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

  // =================================================
  // Status Filter
  // =================================================
  function initStatusFilter() {
    const statusBtn = document.querySelector(".custom-category");
    if (!statusBtn) return;

    const statuses = [...new Set(allProjects.map((p) => p.status).filter(Boolean))];

    let dropdown = null;

    statusBtn.addEventListener("click", (e) => {
      e.stopPropagation();

      if (dropdown) {
        dropdown.remove();
        dropdown = null;
        return;
      }

      const html = `
        <ul class="dropdown-menu show" style="position:absolute; z-index:9999;">
          <li><a class="dropdown-item status-opt" data-status="all">All Status</a></li>
          ${statuses.map((s) => `<li><a class="dropdown-item status-opt" data-status="${s}">${s}</a></li>`).join("")}
        </ul>
      `;

      statusBtn.insertAdjacentHTML("afterend", html);
      dropdown = statusBtn.nextElementSibling;

      dropdown.querySelectorAll(".status-opt").forEach((opt) => {
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
      dropdown?.remove();
      dropdown = null;
    });
  }

  // =================================================
  // Export Filtered + Paginated Excel
  // =================================================
  document.getElementById("exportBtn")?.addEventListener("click", () => {
    const visibleRows = Array.from(document.querySelectorAll(".table-data tr"))
      .filter((row) => row.style.display !== "none");

    if (!visibleRows.length) {
      //alert("No projects to export!");
      return;
    }

    const data = visibleRows.map((row) => {
      const t = row.querySelectorAll("td");
      return {
        "S.No": t[0]?.textContent || "",
        "Project Name": t[1]?.textContent || "",
        "Person Name": t[2]?.textContent || "",
        "Status": t[3]?.textContent || "",
        "Contact No": t[4]?.textContent || "",
        "Email": t[5]?.textContent || "",
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Projects");
    XLSX.writeFile(wb, "Project.xlsx");
  });

  // =================================================
  // Load on page start
  // =================================================
  await loadProjects();
});
