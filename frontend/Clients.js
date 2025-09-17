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

  // Fetch Clients from API
  const tableBody = document.querySelector(".table-data");

  async function loadClients() {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/clients/");
      if (!response.ok) throw new Error("Failed to fetch clients");

      const clients = await response.json();
      tableBody.innerHTML = "";

      clients.forEach((client, index) => {
        const row = `
          <tr>
            <td>${index + 1}</td>
            <td>${client.company_name}</td>
            <td>${client.industry || "-"}</td>
            <td>${client.person_name || "-"}</td>
            <td>${client.contact_number || "-"}</td>
            <td>${client.email || "-"}</td>
            <td>${client.status || "-"}</td>
            <td>
              <button class="btn btn-sm me-1 view-btn" data-id="${client.id}">
                <img src="images/View.png" alt="View">
              </button>
              <button class="btn btn-sm edit-btn" data-id="${client.id}">
                <img src="images/Edit.png" alt="Edit">
              </button>
            </td>
          </tr>
        `;
        tableBody.insertAdjacentHTML("beforeend", row);
      });

      initActions();
      initSearchAndPagination();
    } catch (err) {
      console.error("Error loading clients:", err);
    }
  }

  function initActions() {
    // View button
    document.querySelectorAll(".view-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const clientId = btn.getAttribute("data-id");

        try {
          const res = await fetch(`http://127.0.0.1:8000/api/clients/${clientId}/`);
          if (!res.ok) throw new Error("Failed to fetch client details");
          const client = await res.json();

          let html = `
            <p><strong>Company:</strong> ${client.company_name}</p>
            <p><strong>Industry:</strong> ${client.industry || "-"}</p>
            <p><strong>Person:</strong> ${client.person_name || "-"}</p>
            <p><strong>Contact:</strong> ${client.contact_number || "-"}</p>
            <p><strong>Email:</strong> ${client.email || "-"}</p>
            <p><strong>Website:</strong> ${client.website || "-"}</p>
            <p><strong>Address:</strong> ${client.address || "-"}</p>
            <p><strong>GST:</strong> ${client.gst || "-"}</p>
            <p><strong>AMC:</strong> ${client.amc || "-"}</p>
            <p><strong>AMC Price:</strong> ${client.amc_price || "-"}</p>
            <p><strong>Domain:</strong> ${client.domain_name || "-"}</p>
            <p><strong>Domain Charges:</strong> ${client.domain_charges || "-"}</p>
            <p><strong>Server:</strong> ${client.server_details || "-"}</p>
            <p><strong>Server Price:</strong> ${client.server_price || "-"}</p>
            <p><strong>Maintenance:</strong> ${client.maintenance_value || "-"}</p>
            <p><strong>Comments:</strong> ${client.comments || "-"}</p>
          `;

          document.getElementById("viewClientBody").innerHTML = html;
          new bootstrap.Modal(document.getElementById("viewClientModal")).show();
        } catch (error) {
          console.error(error);
          alert("Failed to load client details.");
        }
      });
    });

    // Edit button
    document.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const clientId = btn.getAttribute("data-id");
        localStorage.setItem("editClientId", clientId); // keep id for edit
        window.location.href = "addclient.html";
      });
    });
  }

  // Search + Pagination
  function initSearchAndPagination() {
    const searchInput = document.querySelector(".search-div input");
    const categoryBtn = document.querySelector(".custom-category");
    const searchBtn = document.querySelector(".custom-search");
    const resetBtn = document.querySelector(".custom-reset");
    const tableRows = document.querySelectorAll(".table-data tr");

    function searchTable() {
      const searchTerm = searchInput.value.toLowerCase();
      tableRows.forEach((row) => {
        const rowText = row.innerText.toLowerCase();
        row.style.display = rowText.includes(searchTerm) ? "" : "none";
      });
    }

    if (searchBtn) searchBtn.addEventListener("click", searchTable);
    if (searchInput) {
      searchInput.addEventListener("keyup", (e) => {
        if (e.key === "Enter") searchTable();
      });
    }

    if (categoryBtn) {
      categoryBtn.addEventListener("click", () => {
        alert("Category filter clicked (expand to filter by industry/company).");
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        searchInput.value = "";
        tableRows.forEach((row) => (row.style.display = ""));
      });
    }

    // Pagination
    const pageInput = document.getElementById("pageInput");
    const paginationLinks = document.querySelectorAll(".pagination .page-link");
    const rowsPerPage = 5;
    let currentPageNumber = 1;

    function paginate(page) {
      const rows = Array.from(tableRows);
      const totalPages = Math.ceil(rows.length / rowsPerPage);

      if (page < 1) page = 1;
      if (page > totalPages) page = totalPages;

      currentPageNumber = page;
      if (pageInput) pageInput.value = currentPageNumber;

      rows.forEach((row, index) => {
        row.style.display =
          index >= (page - 1) * rowsPerPage && index < page * rowsPerPage ? "" : "none";
      });
    }

    paginate(1);

    if (pageInput) {
      pageInput.addEventListener("change", () => {
        paginate(parseInt(pageInput.value, 10));
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
          paginate(parseInt(text, 10));
        }
      });
    });
  }

  // Add Client Button → must clear editClientId
  const addClientBtn = document.querySelector(".custombtn");
  if (addClientBtn) {
    addClientBtn.addEventListener("click", () => {
      localStorage.removeItem("editClientId"); // ensure fresh form
      window.location.href = "addclient.html";
    });
  }

  await loadClients();
});
