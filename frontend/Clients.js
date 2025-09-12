// clients.js

// ===================
// Sidebar Active Menu Highlight
// ===================
document.addEventListener("DOMContentLoaded", () => {
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

  // ===================
  // Sidebar Toggle (Mobile)
  // ===================
  const sidebar = document.getElementById("sidebar");
  const toggleBtn = document.getElementById("sidebarToggle");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      sidebar.classList.toggle("active");
    });
  }

  // ===================
  // Table Data + Search
  // ===================
  const searchInput = document.querySelector(".search-div input");
  const categoryBtn = document.querySelector(".custom-category");
  const searchBtn = document.querySelector(".custom-search");
  const resetBtn = document.querySelector(".custom-reset");
  const tableRows = document.querySelectorAll(".table-data tr");

  // Search Function
  function searchTable() {
    const searchTerm = searchInput.value.toLowerCase();
    tableRows.forEach((row) => {
      const rowText = row.innerText.toLowerCase();
      row.style.display = rowText.includes(searchTerm) ? "" : "none";
    });
  }

  // Search Button Click
  if (searchBtn) {
    searchBtn.addEventListener("click", searchTable);
  }

  // Enter Key Trigger
  if (searchInput) {
    searchInput.addEventListener("keyup", (e) => {
      if (e.key === "Enter") searchTable();
    });
  }

  // Category Filter (example: toggles "All Category")
  if (categoryBtn) {
    categoryBtn.addEventListener("click", () => {
      alert("Category filter clicked (you can expand this to filter by industry/company).");
    });
  }

  // Reset Search
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      searchInput.value = "";
      tableRows.forEach((row) => (row.style.display = ""));
    });
  }

  // ===================
  // Add New Client Button
  // ===================
  const addClientBtn = document.querySelector(".custombtn");
  if (addClientBtn) {
    addClientBtn.addEventListener("click", () => {
      window.location.href = "addclient.html";
    });
  }

  // ===================
  // Pagination
  // ===================
  const pageInput = document.getElementById("pageInput");
  const paginationLinks = document.querySelectorAll(".pagination .page-link");
  const rowsPerPage = 5; // change as needed

  let currentPageNumber = 1;

  function paginate(page) {
    const rows = Array.from(tableRows);
    const totalPages = Math.ceil(rows.length / rowsPerPage);

    // Clamp page number
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;

    currentPageNumber = page;
    pageInput.value = currentPageNumber;

    rows.forEach((row, index) => {
      row.style.display =
        index >= (page - 1) * rowsPerPage && index < page * rowsPerPage ? "" : "none";
    });
  }

  // Initial Pagination
  paginate(1);

  // Page Input Change
  if (pageInput) {
    pageInput.addEventListener("change", () => {
      paginate(parseInt(pageInput.value, 10));
    });
  }

  // Previous / Next / Numbered Pages
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
});



// ===================
// Category Filter by Industry Column
// ===================
const categoryItems = document.querySelectorAll("#categoryList .dropdown-item");
const categoryDropdown = document.getElementById("categoryDropdown");

if (categoryItems) {
  categoryItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const category = item.getAttribute("data-category");

      // Update dropdown text
      categoryDropdown.innerText = category;

      tableRows.forEach((row) => {
        const industryCell = row.cells[2]?.innerText.toLowerCase(); // Industry is 3rd column
        if (category === "all" || industryCell === category.toLowerCase()) {
          row.style.display = "";
        } else {
          row.style.display = "none";
        }
      });
    });
  });
}
