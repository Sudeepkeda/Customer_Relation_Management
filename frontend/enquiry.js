// ===================
// Sidebar + Table + API Integration for Enquiries
// ===================
document.addEventListener("DOMContentLoaded", async () => {
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

  // Fetch Enquiries from API
  const tableBody = document.querySelector(".table-data");
  let allEnquiries = []; // keep full list for filtering

  async function loadEnquiries() {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/enquiries/");
      if (!response.ok) throw new Error("Failed to fetch enquiries");

      allEnquiries = await response.json();
      renderTable(allEnquiries);

      initActions();
      initSearchAndPagination();
      initStatusFilter();
    } catch (err) {
      console.error("Error loading enquiries:", err);
      tableBody.innerHTML = `<tr><td colspan="9" class="text-center text-danger">Failed to load enquiries.</td></tr>`;
    }
  }

  // Render table rows
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
            <button class="btn btn-sm me-1 view-btn" data-id="${enquiry.id}">
              <img src="images/View.png" alt="View">
            </button>
            <button class="btn btn-sm edit-btn" data-id="${enquiry.id}">
              <img src="images/Edit.png" alt="Edit">
            </button>
            <button class="btn btn-sm delete-btn" data-id="${enquiry.id}">
        <img src="images/Delete.png" alt="Delete">
      </button>
          </td>
        </tr>
      `;
      tableBody.insertAdjacentHTML("beforeend", row);
    });
  }

  function initActions() {
    // View button
    document.querySelectorAll(".view-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const enquiryId = btn.getAttribute("data-id");

        try {
          const res = await fetch(`http://127.0.0.1:8000/api/enquiries/${enquiryId}/`);
          if (!res.ok) throw new Error("Failed to fetch enquiry details");
          const enquiry = await res.json();

          let html = `
            <p><strong>Date:</strong> ${enquiry.date || "-"}</p>
            <p><strong>Company:</strong> ${enquiry.company_name || "-"}</p>
            <p><strong>Person:</strong> ${enquiry.person_name || "-"}</p>
            <p><strong>Contact:</strong> ${enquiry.contact_number || "-"}</p>
            <p><strong>Email:</strong> ${enquiry.email || "-"}</p>
            <p><strong>Website:</strong> ${enquiry.website || "-"}</p>
            <p><strong>Status:</strong> ${enquiry.status || "-"}</p>
            <p><strong>Comments:</strong> ${enquiry.comments || "-"}</p>
          `;

          document.getElementById("viewClientBody").innerHTML = html;
          new bootstrap.Modal(document.getElementById("viewClientModal")).show();
        } catch (error) {
          console.error(error);
          alert("Failed to load enquiry details.");
        }
      });
    });

    // Edit button
    document.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const enquiryId = btn.getAttribute("data-id");
        localStorage.setItem("editEnquiryId", enquiryId);
        window.location.href = "addenquiry.html";
      });
    });

// Delete button
document.querySelectorAll(".delete-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const enquiryId = btn.getAttribute("data-id");

    if (!confirm("Are you sure you want to delete this enquiry?")) return;

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/enquiries/${enquiryId}/`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("Enquiry deleted successfully!");
        await loadEnquiries(); // refresh table
      } else {
        alert("Failed to delete enquiry.");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Something went wrong while deleting.");
    }
  });
});


  }

  // Search + Pagination
  function initSearchAndPagination() {
    const searchInput = document.querySelector(".search-div input");
    const searchBtn = document.querySelector(".custom-search");
    const resetBtn = document.querySelector(".custom-reset");

    function searchTable() {
      const searchTerm = searchInput.value.toLowerCase().trim();

      const filtered = allEnquiries.filter(c => {
        return (
          (c.company_name && c.company_name.toLowerCase().includes(searchTerm)) ||
          (c.person_name && c.person_name.toLowerCase().includes(searchTerm)) ||
          (c.email && c.email.toLowerCase().includes(searchTerm)) ||
          (c.status && c.status.toLowerCase().includes(searchTerm))
        );
      });

      renderTable(filtered);
      initActions();
    }

    if (searchBtn) searchBtn.addEventListener("click", searchTable);
    if (searchInput) {
      searchInput.addEventListener("keyup", (e) => {
        if (e.key === "Enter") searchTable();
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        searchInput.value = "";
        renderTable(allEnquiries);
        initActions();
      });
    }

    // Pagination
    const pageInput = document.getElementById("pageInput");
    const paginationLinks = document.querySelectorAll(".pagination .page-link");

    let rowsPerPage = 10;
    let currentPageNumber = 1;

    function paginate(page) {
      const rows = Array.from(document.querySelectorAll(".table-data tr"));
      const totalPages = Math.ceil(rows.length / rowsPerPage);

      if (page < 1) page = 1;
      if (page > totalPages) page = totalPages;

      currentPageNumber = page;

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

  // ✅ Status Filter
  function initStatusFilter() {
    const statusBtn = document.querySelector(".custom-category");
    if (!statusBtn) return;

    // collect unique statuses
    const statuses = [...new Set(allEnquiries.map(c => c.status).filter(Boolean))];

    // build dropdown
    let dropdownHtml = `
      <ul class="dropdown-menu show" style="position:absolute; z-index:1000;">
        <li><a class="dropdown-item status-option" data-status="all">All Status</a></li>
        ${statuses.map(st => `<li><a class="dropdown-item status-option" data-status="${st}">${st}</a></li>`).join("")}
      </ul>
    `;

    let dropdown;
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
            const status = opt.getAttribute("data-status");

            if (status === "all") {
              renderTable(allEnquiries);
            } else {
              const filtered = allEnquiries.filter(c => c.status === status);
              renderTable(filtered);
            }
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

  // Add Enquiry Button → must clear editEnquiryId
  const addEnquiryBtn = document.querySelector(".custombtn");
  if (addEnquiryBtn) {
    addEnquiryBtn.addEventListener("click", () => {
      localStorage.removeItem("editEnquiryId");
      window.location.href = "addenquiry.html";
    });
  }

  await loadEnquiries();
});
