// ===================
// Sidebar + Table + API Integration for Quotations
// ===================
document.addEventListener("DOMContentLoaded", async () => {
const BASE_URL = window.location.origin;
const token = localStorage.getItem("authToken");
if (!token) {
  //alert("Session expired. Please log in again.");
  window.location.href = "/";
  return;
}

 document.querySelectorAll(".nav-list .nav-link").forEach(link => {
  const linkHref = link.getAttribute("href").toLowerCase();
  const currentPath = window.location.pathname.toLowerCase();

  
  if (currentPath === linkHref || currentPath.startsWith(linkHref + "/")) {
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

  const tableBody = document.querySelector(".table-data");
  let allQuotations = [];
  let currentFiltered = [];
  let currentCompany = "all";
  
  
  //profile redirection
  const profileLogo = document.querySelector(".dashboard-head img");
    if (profileLogo) {
      profileLogo.addEventListener("click", () => {
        window.location.href = "/user-profile/";
      });
    }
    
  

  // ===================
  // Apply Filters Function
  // ===================
  function applyFilters() {
    const searchInput = document.querySelector(".search-div input");
    const term = searchInput ? searchInput.value.toLowerCase().trim() : '';
    let filtered = [...allQuotations];

    // Search Filter
    if (term) {
      filtered = filtered.filter(q =>
        (q.company_name && q.company_name.toLowerCase().includes(term)) ||
        (q.person_name && q.person_name.toLowerCase().includes(term)) ||
        (q.email && q.email.toLowerCase().includes(term)) ||
        (q.quotation_number && q.quotation_number.toLowerCase().includes(term))
      );
    }

    // Date Filter
    const fromDateInput = document.getElementById('fromDate');
    const toDateInput = document.getElementById('toDate');
    const fromDate = fromDateInput ? fromDateInput.value : '';
    const toDate = toDateInput ? toDateInput.value : '';

    if (fromDate) {
      const fromD = new Date(fromDate);
      filtered = filtered.filter(q => {
        if (!q.quotation_date) return false;
        return new Date(q.quotation_date) >= fromD;
      });
    }

    if (toDate) {
      const toD = new Date(toDate + 'T23:59:59');
      filtered = filtered.filter(q => {
        if (!q.quotation_date) return false;
        return new Date(q.quotation_date) <= toD;
      });
    }

    // Company Filter
    if (currentCompany && currentCompany.toLowerCase() !== 'all') {
      filtered = filtered.filter(q => q.company_name && q.company_name === currentCompany);
    }

    currentFiltered = filtered;
    renderTable(filtered);
    initActions();
    paginate(1);
  }

  // ===================
  // Fetch Quotations
  // ===================
  async function loadQuotations() {
  try {
    const token = localStorage.getItem("authToken");

    if (!token) {
     // alert("Session expired. Please log in again.");
      window.location.href = "/";
      return;
    }
       
    const response = await fetch(`${BASE_URL}/api/quotations/`, {
      headers: {
        "Authorization": token.startsWith("Token") ? token : "Token " + token,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) throw new Error("Failed to fetch quotations");

    allQuotations = await response.json();
    allQuotations.sort((a, b) => b.id - a.id);
    currentFiltered = [...allQuotations];

    initSearchAndPagination();
    initCompanyFilter();
    initExportButton();
    applyFilters();

  } catch (err) {
    console.error("Error loading quotations:", err);
    tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Failed to load quotations.</td></tr>`;
  }
}


  // ===================
  // Render Table
  // ===================
  function renderTable(quotations) {
  tableBody.innerHTML = "";

  if (quotations.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="7" class="text-center">No quotations found</td></tr>`;
    return;
  }

  quotations.forEach((q, index) => {
    const row = `
      <tr>
        <td>${index + 1}</td>
        <td>${q.quotation_date || "-"}</td>
        <td>${q.quotation_number || "-"}</td>
        <td>${q.company_name || "-"}</td>
        <td>${q.description || "-"}</td>
        <td>₹${q.price ? Number(q.price).toFixed(2) : "0.00"}</td>
        <td>
          <div class="dropdown">
            <button class="btn btn-sm btn-light" type="button" data-bs-toggle="dropdown" aria-expanded="false">
              <i class="bi bi-three-dots-vertical"></i>
            </button>
            <ul class="dropdown-menu dropdown-menu-end">
              <li>
                <a href="#" class="dropdown-item btn-view" data-id="${q.id}">
                  <img src="/static/images/View.png" alt="View" class="me-2" style="width:16px;"> View
                </a>
              </li>
              <li>
                <a href="#" class="dropdown-item btn-edit" data-id="${q.id}">
                  <img src="/static/images/Edit.png" alt="Edit" class="me-2" style="width:16px;"> Edit
                </a>
              </li>
              <li>
                <a href="#" class="dropdown-item btn-send" data-id="${q.id}">
                  <img src="/static/images/send.png" alt="Send" class="me-2" style="width:16px;"> Send Mail
                </a>
              </li>
              <li>
                <a href="#" class="dropdown-item btn-duplicate" data-id="${q.id}">
                  <img src="/static/images/Duplicate.png" alt="Duplicate" class="me-2" style="width:16px;"> Duplicate
                </a>
              </li>
              <li>
                <a href="#" class="dropdown-item btn-download" data-id="${q.id}">
                  <img src="/static/images/Download.png" alt="Download" class="me-2" style="width:16px;"> Download
                </a>
              </li>
              <li>
              <a href="#" class="dropdown-item delete-btn" data-id="${q.id}">
                <img src="/static/images/Delete.png" alt="Delete" class="me-2" style="width:16px;">Delete
                </a>
              </li>
              
            </ul>
          </div>
        </td>
      </tr>
    `;
    tableBody.insertAdjacentHTML("beforeend", row);
  });
}

  // ===================
  // View / Edit / Send Actions
  // ===================
  function initActions() {
    document.querySelectorAll(".btn-view").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        try {
          const res = await fetch(`${BASE_URL}/api/quotations/${id}/`,{
              headers: { "Authorization": "Token " + localStorage.getItem("authToken") },
          });
          
          if (!res.ok) throw new Error("Failed to fetch details");
          const q = await res.json();

            let servicesHtml = "";
          const sectionMap = {
            about_us: "About Us",
            about: "About Us",
            technical: "Technical Details of Design Services",
            tech: "Technical Details of Design Services",
            scope: "Out of Scope",
            pricing: "Pricing"
          };

          (q.services || []).forEach(s => {
            const key = (s.type || "").toLowerCase();
            const title = sectionMap[key] || key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
            servicesHtml += `
              <div style="margin-bottom: 15px;">
                <h6 style="margin-bottom:5px; font-size: 14px; font-weight: bold;">${title}</h6>
                <div>${s.content}</div>
              </div>`;
          });


          document.getElementById("viewModalBody").innerHTML = `
            <div class="container-fluid">
              <div class="row g-3">
                <div class="col-md-4"><strong>Quotation Number:</strong> ${q.quotation_number || "-"}</div>
                <div class="col-md-4"><strong>Date:</strong> ${q.quotation_date || "-"}</div>
                <div class="col-md-4"><strong>Company:</strong> ${q.company_name || "-"}</div>
                <div class="col-md-4"><strong>Industry:</strong> ${q.industry || "-"}</div>
                <div class="col-md-4"><strong>Person:</strong>${q.person_name || "-"}</div>
                <div class="col-md-4"><strong>Contact:</strong> ${q.contact || "-"}</div>
                <div class="col-md-6"><strong>Email: </strong>${q.email || "-"}</div>
                <div class="col-md-6"><strong>Website:</strong> ${q.website || "-"}</div>
                <div class="col-md-6"><strong>Address:</strong> ${q.address || "-"}</div>
                <div class="col-md-6"><strong>Price: ₹</strong>${q.price ? Number(q.price).toFixed(2) : "0.00"}</div>
                <div class="col-6"><strong>Description:</strong> ${q.description || "-"}</div>
              </div>
              <hr>
              <h6 class="fw-bold mb-2">Services:</h6>
              <div>${servicesHtml}</div>
            </div>`;
          new bootstrap.Modal(document.getElementById("viewModal")).show();
        } catch (err) {
          console.error(err);
          //alert("Failed to fetch quotation details.");
        }
      });
    });

    // Edit
    document.querySelectorAll(".btn-edit").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        window.location.href = `/quotation/add/?id=${id}`;
      });
    });

    // Send
    document.querySelectorAll(".btn-send").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        try {
          const res = await fetch(`${BASE_URL}/api/send-quotation-mail/${id}/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" }
          });
          if (!res.ok) throw new Error("Failed to send email");
          const data = await res.json();
          alert(`Quotation sent to ${data.email}`);
        } catch (err) {
          console.error(err);
         alert(" Failed to send quotation email.");
        }
      });
    });
    
    // Duplicate
document.querySelectorAll(".btn-duplicate").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    const id = btn.dataset.id;

    // Go to add page in duplicate mode
    window.location.href = `/quotation/add/?duplicate=${id}`;
  });
});


 // DELETE
    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
       // if (!confirm("Are you sure you want to delete this Quotation?")) return;

        try {
          const res = await fetch(`${BASE_URL}/api/quotations/${btn.dataset.id}/`, {
            method: "DELETE",
            headers: {
              "Authorization": token.startsWith("Token") ? token : "Token " + token
            }
          });

          if (res.ok) {
          //  alert("Quotation deleted successfully!");
            await loadQuotations(); 
          } else {
           // alert("Failed to delete Quotations.");
          }
        } catch (err) {
          console.error(err);
          //alert("Server error while deleting.");
        }
      });
    });


    // DOWNLOAD PDF
document.querySelectorAll(".btn-download").forEach((btn) => {
  btn.addEventListener("click", async (e) => {
    e.preventDefault();
    const id = btn.dataset.id;

    try {
      const token = localStorage.getItem("authToken");

      const res = await fetch(`${BASE_URL}/api/download-quotation/${id}/`, {
        headers: {
          "Authorization": token.startsWith("Token") ? token : "Token " + token
        }
      });

      if (!res.ok) throw new Error("Failed to download PDF");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      // Always download as a clean filename (no ids/numbers)
      a.download = `Quotation.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();

    } catch (err) {
      console.error(err);
      alert("Failed to download quotation.");
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

    searchBtn?.addEventListener("click", applyFilters);
    searchInput?.addEventListener("keyup", (e) => { if (e.key === "Enter") applyFilters(); });
    resetBtn?.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      document.getElementById('fromDate').value = "";
      document.getElementById('toDate').value = "";
      currentCompany = "all";
      document.querySelector(".custom-category").innerText = "All Companies";
      applyFilters();
    });

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

    window.paginate = paginate;
  }

  // ===================
  // Company Filter
  // ===================
  function initCompanyFilter() {
    const companyBtn = document.querySelector(".custom-category");
    if (!companyBtn) return;

    let dropdown;

    companyBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (dropdown) { dropdown.remove(); dropdown = null; return; }

      const companies = [...new Set(allQuotations.map(q => q.company_name).filter(Boolean))];

      const html = `
        <ul class="dropdown-menu show" style="position:absolute; z-index:1000;">
          <li><a class="dropdown-item company-option" data-company="all">All Companies</a></li>
          ${companies.map(c => `<li><a class="dropdown-item company-option" data-company="${c}">${c}</a></li>`).join("")}
        </ul>`;

      companyBtn.insertAdjacentHTML("afterend", html);
      dropdown = companyBtn.nextElementSibling;

      dropdown.querySelectorAll(".company-option").forEach(opt => {
        opt.addEventListener("click", () => {
          currentCompany = opt.dataset.company;
          companyBtn.innerText = opt.innerText;
          applyFilters();
          dropdown.remove();
          dropdown = null;
        });
      });
    });

    document.addEventListener("click", () => { if (dropdown) { dropdown.remove(); dropdown = null; } });
  }

  // ===================
  // Export Excel (Filtered)
  // ===================
  function initExportButton() {
    const exportBtn = document.getElementById("exportBtn");
    exportBtn?.addEventListener("click", () => {
      if (!currentFiltered.length) {
        //alert("No quotations to export!");
        return;
      }

      const data = currentFiltered.map(c => ({
        "Quotation Date": c.quotation_date || "-",
        "Quotation Number": c.quotation_number || "-",
        "Company Name": c.company_name || "-",
        "Person Name": c.person_name || "-",
        "Email": c.email || "-",
        "Price": c.price ? `₹${Number(c.price).toFixed(2)}` : "₹0.00",
        "Description": c.description || "-",
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Quotations");
      XLSX.writeFile(wb, "Quotation.xlsx");
    });
  }

  // ===================
  // Init
  // ===================
  await loadQuotations();
});
