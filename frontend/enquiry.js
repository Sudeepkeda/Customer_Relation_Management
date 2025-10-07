// ===================
// Sidebar + Table + API Integration for Enquiries
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
  let allEnquiries = []; // full list for filtering
  const profileLogo = document.querySelector(".dashboard-head img");
    if (profileLogo) {
      profileLogo.addEventListener("click", () => {
        window.location.href = "profile.html";
      });
    }
  // ===================
  // Fetch Enquiries
  // ===================
  async function loadEnquiries() {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/enquiries/");
      if (!response.ok) throw new Error("Failed to fetch enquiries");

      allEnquiries = await response.json();
      renderTable(allEnquiries);

      initActions();
      initSearchAndPagination();
      paginate(1);
      initStatusFilter();

    } catch (err) {
      console.error("Error loading enquiries:", err);
      tableBody.innerHTML = `<tr><td colspan="9" class="text-center text-danger">Failed to load enquiries.</td></tr>`;
    }
  }

  // ===================
  // Render Table
  // ===================
  function renderTable(enquiries) {
    tableBody.innerHTML = "";

    if (enquiries.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="9" class="text-center">No enquiries found</td></tr>`;
      return;
    }

    enquiries.forEach((enquiry, index) => {
      const row = `
        <tr>
          <td>${index + 1}</td>
          <td>${enquiry.date || "-"}</td>
          <td>${enquiry.company_name || "-"}</td>
          <td>${enquiry.person_name || "-"}</td>
          <td>${enquiry.contact_number || "-"}</td>
          <td>${enquiry.email || "-"}</td>
          <td>${enquiry.website || "-"}</td>
          <td>${enquiry.status || "-"}</td>
          <td>
            <div class="d-flex flex-nowrap">
              <button class="btn btn-sm me-1 view-btn" data-id="${enquiry.id}">
                <img src="images/View.png" alt="View">
              </button>
              <button class="btn btn-sm edit-btn" data-id="${enquiry.id}">
                <img src="images/Edit.png" alt="Edit">
              </button>
              <button class="btn btn-sm delete-btn" data-id="${enquiry.id}">
                <img src="images/Delete.png" alt="Delete">
              </button>
            </div>
          </td>
        </tr>
      `;
      tableBody.insertAdjacentHTML("beforeend", row);
    });
    
  }

  // ===================
  // View / Edit / Delete Actions
  // ===================
  function initActions() {
    // View
    document.querySelectorAll(".view-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const enquiryId = btn.dataset.id;
        try {
          const res = await fetch(`http://127.0.0.1:8000/api/enquiries/${enquiryId}/`);
          if (!res.ok) throw new Error("Failed to fetch enquiry details");
          const enquiry = await res.json();

          const html = `
            <div class="container-fluid">
              <div class="row g-3">
                <div class="col-md-4"><strong>Date:</strong> ${enquiry.date || "-"}</div>
                <div class="col-md-4"><strong>Company Name:</strong> ${enquiry.company_name || "-"}</div>
                <div class="col-md-4"><strong>Person Name:</strong> ${enquiry.person_name || "-"}</div>
                <div class="col-md-4"><strong>Contact Number:</strong> ${enquiry.contact_number || "-"}</div>
                <div class="col-md-4 text-break"><strong>Email:</strong> ${enquiry.email || "-"}</div>
                <div class="col-md-4 text-break"><strong>Website:</strong> ${enquiry.website || "-"}</div>
                <div class="col-md-4"><strong>Status:</strong> ${enquiry.status || "-"}</div>
                <div class="col-12"><strong>Comments:</strong> ${enquiry.comments || "-"}</div>
              </div>
            </div>
          `;
          document.getElementById("viewClientBody").innerHTML = html;
          new bootstrap.Modal(document.getElementById("viewClientModal")).show();
        } catch (error) {
          console.error(error);
          alert("Failed to load enquiry details.");
        }
      });
    });

    // Edit
    document.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        localStorage.setItem("editEnquiryId", btn.dataset.id);
        window.location.href = "addenquiry.html";
      });
    });

    // Delete
    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm("Are you sure you want to delete this enquiry?")) return;
        try {
          const res = await fetch(`http://127.0.0.1:8000/api/enquiries/${btn.dataset.id}/`, {
            method: "DELETE"
          });
          if (res.ok) {
            alert("Enquiry deleted successfully!");
            await loadEnquiries();
          } else alert("Failed to delete enquiry.");
        } catch (err) {
          console.error(err);
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
      const filtered = allEnquiries.filter(c =>
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
    resetBtn?.addEventListener("click", () => { searchInput.value = ""; renderTable(allEnquiries); initActions(); paginate(1); });

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
  // Status Filter
  // ===================
  function initStatusFilter() {
    const statusBtn = document.querySelector(".custom-category");
    if (!statusBtn) return;

    const statuses = [...new Set(allEnquiries.map(c => c.status).filter(Boolean))];
    const dropdownHtml = `
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
            const filtered = status === "all" ? allEnquiries : allEnquiries.filter(c => c.status === status);
            renderTable(filtered);
            initActions();
            window.paginate(1);
            dropdown.remove();
            dropdown = null;
          });
        });
      }
    });

    document.addEventListener("click", () => { if (dropdown) { dropdown.remove(); dropdown = null; } });
  }

  // ===================
  // Add Enquiry Button
  // ===================
  document.querySelector(".custombtn")?.addEventListener("click", () => {
    localStorage.removeItem("editEnquiryId");
    window.location.href = "addenquiry.html";
  });

  // Load enquiries on page load
  await loadEnquiries();

const exportBtn = document.getElementById("exportBtn");

exportBtn.addEventListener("click", () => {
  if (!allEnquiries.length) {
    alert("No clients to export!");
    return;
  }

  // Map data for Excel
  const data = allEnquiries.map(c => ({
    "Person Name": c.person_name || "-",
    "Company Name": c.company_name || "-",
    "Contact Number": c.contact_number || "-",
    "Email": c.email || "-",
    "Status": c.status || "-",
    "Website": c.website || "-",
    "Comments": c.comments || "-",
  }));

  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(data);

  // Create workbook and append
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Enquiry");

  // Download Excel file
  XLSX.writeFile(wb, "Enquiry_List.xlsx");
});

});
