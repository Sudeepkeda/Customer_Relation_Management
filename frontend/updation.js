// ===================
// Load and Render Updations
// ===================
async function loadProjects() {
  try {
    const res = await fetch("http://127.0.0.1:8000/api/updations/");
    if (!res.ok) throw new Error("Failed to load updations");
    const updations = await res.json();
    renderTable(updations);
  } catch (error) {
    console.error("Load error:", error);
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

  // Attach event listeners for buttons
  document.querySelectorAll(".view-btn").forEach(btn =>
    btn.addEventListener("click", e => handleView(e.target.closest("button").dataset.id))
  );
  document.querySelectorAll(".edit-btn").forEach(btn =>
    btn.addEventListener("click", e => handleEdit(e.target.closest("button").dataset.id))
  );
  document.querySelectorAll(".delete-btn").forEach(btn =>
    btn.addEventListener("click", e => handleDelete(e.target.closest("button").dataset.id))
  );
}

// ===================
// VIEW FUNCTION (Show Modal)
// ===================
async function handleView(id) {
  try {
    const res = await fetch(`http://127.0.0.1:8000/api/updations/${id}/`);
    if (!res.ok) throw new Error("Failed to fetch record");

    const upd = await res.json();

    // Populate modal body
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

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById("viewClientModal"));
    modal.show();
  } catch (error) {
    console.error("View error:", error);
    alert("Failed to load record details");
  }
}

// ===================
// EDIT FUNCTION (Redirect with ID)
// ===================
function handleEdit(id) {
  // Redirect to addupdation.html with edit query param
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
      loadProjects(); // refresh table
    } else {
      alert("Error deleting record.");
    }
  } catch (error) {
    console.error("Delete error:", error);
    alert("Something went wrong!");
  }
}

// ===================
// Initialize
// ===================
document.addEventListener("DOMContentLoaded", loadProjects);


 // Sidebar Active Menu Highlight
  const currentPage = window.location.pathname.split("/").pop().toLowerCase();
  const navLinks = document.querySelectorAll(".nav-list .nav-link");
  navLinks.forEach((link) => {
    const linkPage = link.getAttribute("href").toLowerCase();
    if (linkPage === currentPage) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });

  // Sidebar Toggle (Mobile)
  const sidebar = document.getElementById("sidebar");
  const toggleBtn = document.getElementById("sidebarToggle");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      sidebar.classList.toggle("active");
    });
  }
