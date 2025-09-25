// ===================
// Sidebar + Table + API Integration
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

  // ===================
  // Fetch Quotations from API
  // ===================
  const tableBody = document.querySelector(".table-data");

  async function loadQuotations() {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/quotations/");
      if (!response.ok) throw new Error("Failed to fetch quotations");

      let quotations = await response.json();

      // sort newest first by id
      quotations.sort((a, b) => b.id - a.id);

      tableBody.innerHTML = "";

      quotations.forEach((quotation, index) => {
        const row = `
          <tr>
            <td>${index + 1}</td>
            <td>${quotation.quotation_date || "-"}</td>
            <td>${quotation.quotation_number || "-"}</td>
            <td>${quotation.company_name || "-"}</td>
            <td>${quotation.description || "-"}</td>
            <td>₹${quotation.price ? Number(quotation.price).toFixed(2) : "0.00"}</td>
            <td>
              <button class="btn btn-sm me-1 btn-view" data-id="${quotation.id}">
                <img src="images/View.png" alt="View">
              </button>
              <button class="btn btn-sm btn-edit" data-id="${quotation.id}">
                <img src="images/Edit.png" alt="Edit">
              </button>
              <button class="btn btn-sm btn-send" data-id="${quotation.id}">
                <img src="images/send.png" alt="Send">
              </button>
            </td>
          </tr>
        `;
        tableBody.insertAdjacentHTML("beforeend", row);
      });

      initActions();
      initSearchAndPagination();
    } catch (err) {
      console.error("Error loading quotations:", err);
    }
  }

  await loadQuotations();

  // ===================
  // Action Buttons
  // ===================
  function initActions() {
    // View
    document.querySelectorAll(".btn-view").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-id");
        try {
          const res = await fetch(`http://127.0.0.1:8000/api/quotations/${id}/`);
          if (!res.ok) throw new Error("Failed to fetch details");
          const q = await res.json();

          document.getElementById("viewModalBody").innerHTML = `
            <p><strong>Quotation Number:</strong> ${q.quotation_number || "-"}</p>
            <p><strong>Date:</strong> ${q.quotation_date || "-"}</p>
            <p><strong>Company Name:</strong> ${q.company_name || "-"}</p>
            <p><strong>Person Name:</strong> ${q.person_name || "-"}</p>
            <p><strong>Description:</strong> ${q.description || "-"}</p>
            <p><strong>Price:</strong> ₹${q.price ? Number(q.price).toFixed(2) : "0.00"}</p>
            <p><strong>Services:</strong></p>
            <ul>
              ${(q.services || [])
                .map((s) => `<li><strong>${s.type}</strong>: ${s.content}</li>`)
                .join("")}
            </ul>
          `;

          const modal = new bootstrap.Modal(document.getElementById("viewModal"));
          modal.show();
        } catch (err) {
          console.error("View failed:", err);
        }
      });
    });

    // Edit
    document.querySelectorAll(".btn-edit").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        // ✅ Redirect with ?id= so addquotation.js loads in edit mode
        window.location.href = `addquotation.html?id=${id}`;
      });
    });

    // Send
    document.querySelectorAll(".btn-send").forEach((btn) => {
      btn.addEventListener("click", () => {
        alert("Send feature not implemented yet.");
      });
    });
  }

  // ===================
  // Search + Pagination (simple demo)
  // ===================
  function initSearchAndPagination() {
    const searchInput = document.querySelector(".search-div input");
    const searchBtn = document.querySelector(".custom-search");
    const resetBtn = document.querySelector(".custom-reset");

    if (searchBtn) {
      searchBtn.addEventListener("click", () => alert("Search not implemented yet."));
    }
    if (resetBtn) {
      resetBtn.addEventListener("click", () => alert("Reset not implemented yet."));
    }

    const pageInput = document.getElementById("pageInput");
    const paginationLinks = document.querySelectorAll(".pagination .page-link");

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
});
