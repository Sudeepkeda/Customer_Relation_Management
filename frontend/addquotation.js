// ===================
// DOM Elements
// ===================
const companyDropdown = document.getElementById("companyName");
const servicesDropdown = document.getElementById("services");
const editorRow = document.getElementById("editorRow");
const editorLabel = document.getElementById("editorLabel");

let editorInstance = null;
let servicesArray = [];
let currentServiceType = null;
let editId = null; // <-- to detect edit mode

// ===================
// Initialize after DOM loaded
// ===================
document.addEventListener("DOMContentLoaded", async () => {
  // Check for edit mode (?id=123)
  const urlParams = new URLSearchParams(window.location.search);
  editId = urlParams.get("id");

  if (editId) {
    // ✅ Change button text to "Update"
    const submitBtn = document.querySelector("#quotationForm button[type='submit']");
    if (submitBtn) submitBtn.textContent = "Update";

    // Editing → load quotation first, then companies with preselect
    await loadQuotationForEdit(editId);
  } else {
    // Adding → just load companies
    await loadCompanies();
  }

  servicesDropdown.addEventListener("change", handleServiceChange);
  document.getElementById("quotationForm").addEventListener("submit", handleFormSubmit);

  // ===================
// Sidebar Active Menu Highlight
// ===================
const currentPage = window.location.pathname.split("/").pop().toLowerCase();
const navLinks = document.querySelectorAll('.nav-list .nav-link');

navLinks.forEach(link => {
  const linkPage = link.getAttribute('href').toLowerCase();

  // ✅ Highlight "Projects" also when on addproject.html
  if (
    linkPage === currentPage ||
    (currentPage === "addquotation.html" && linkPage === "quotation.html")
  ) {
    link.classList.add('active');
  } else {
    link.classList.remove('active');
  }
});


    // Sidebar Toggle
  const sidebar = document.getElementById("sidebar");
  const toggleBtn = document.getElementById("sidebarToggle");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", function () {
      sidebar.classList.toggle("active");
    });
  }

});

// ===================
// Load companies from API
// ===================
async function loadCompanies(selectedCompanyId = null) {
  try {
    const response = await fetch("http://127.0.0.1:8000/api/clients/");
    const companies = await response.json();

    companyDropdown.innerHTML = '<option value="">-- Select Company --</option>';
    companies.forEach(c => {
      const option = document.createElement("option");
      option.value = c.id;
      option.textContent = c.company_name;
      option.dataset.industry = c.industry || "";
      option.dataset.person = c.person_name || "";
      option.dataset.contact = c.contact_number || "";
      option.dataset.email = c.email || "";
      option.dataset.website = c.website || "";
      option.dataset.address = c.address || "";
      companyDropdown.appendChild(option);
    });

    // ✅ Only pre-select when editing
    if (selectedCompanyId) {
      companyDropdown.value = String(selectedCompanyId);
      handleCompanyChange.call(companyDropdown);
    }

    companyDropdown.addEventListener("change", handleCompanyChange);
  } catch (error) {
    console.error("Error loading companies:", error);
  }
}

// ===================
// Populate fields when company changes
// ===================
function handleCompanyChange() {
  const selected = this.options[this.selectedIndex];
  document.getElementById("industry").value = selected.dataset.industry || "";
  document.getElementById("personName").value = selected.dataset.person || "";
  document.getElementById("Contact").value = selected.dataset.contact || "";
  document.getElementById("Email").value = selected.dataset.email || "";
  document.getElementById("Website").value = selected.dataset.website || "";
  document.getElementById("Address").value = selected.dataset.address || "";
}

// ===================
// Load quotation data for editing
// ===================
async function loadQuotationForEdit(id) {
  try {
    const res = await fetch(`http://127.0.0.1:8000/api/quotations/${id}/`);
    if (!res.ok) throw new Error("Failed to fetch quotation for edit");
    const q = await res.json();

    // Load companies and pre-select
    await loadCompanies(q.client); // client field from backend

    //  Directly populate readonly fields
    document.getElementById("industry").value = q.industry || "";
    document.getElementById("personName").value = q.person_name || "";
    document.getElementById("Contact").value = q.contact || "";
    document.getElementById("Email").value = q.email || "";
    document.getElementById("Website").value = q.website || "";
    document.getElementById("Address").value = q.address || "";

    // Fill editable fields
    document.getElementById("Description").value = q.description || "";
    document.getElementById("Price").value = q.price || "";

    // Load services into array
    servicesArray = q.services || [];

    if (servicesArray.length > 0) {
      servicesDropdown.value = servicesArray[0].type;
      handleServiceChange.call(servicesDropdown);
    }
  } catch (err) {
    console.error("Error loading quotation for edit:", err);
  }
}

// ===================
// Handle service dropdown changes
// ===================
function handleServiceChange() {
  const newType = this.value;

  // Save previous editor content
  if (currentServiceType && editorInstance) {
    const content = editorInstance.getData().trim();
    if (content) {
      const existing = servicesArray.find(s => s.type === currentServiceType);
      if (existing) {
        existing.content = content;
      } else {
        servicesArray.push({ type: currentServiceType, content });
      }
    }
  }

  if (newType) {
    editorLabel.textContent = this.options[this.selectedIndex].text;
    editorRow.style.display = "block";
    currentServiceType = newType;

    if (!editorInstance) {
  editorInstance = CKEDITOR.replace("editor", {
    height: 400,
    removePlugins: 'elementspath',
    resize_enabled: true,
    toolbar: [
      { name: 'document', items: ['Source','Preview','Print','PageBreak'] },
      { name: 'clipboard', items: ['Cut','Copy','Paste','PasteText','PasteFromWord','Undo','Redo'] },
      { name: 'editing', items: ['Find','Replace','SelectAll','Scayt'] },
      '/',
      { name: 'basicstyles', items: ['Bold','Italic','Underline','Strike','RemoveFormat','CopyFormatting'] },
      { name: 'paragraph', items: ['NumberedList','BulletedList','-','Outdent','Indent','Blockquote',
        '-','JustifyLeft','JustifyCenter','JustifyRight','JustifyBlock'] },
      { name: 'links', items: ['Link','Unlink','Anchor'] },
      { name: 'insert', items: ['Image','Table','HorizontalRule','SpecialChar'] },
      '/',
      { name: 'styles', items: ['Styles','Format','Font','FontSize'] },
      { name: 'colors', items: ['TextColor','BGColor'] },
      { name: 'tools', items: ['Maximize','ShowBlocks'] },
      { name: 'table', items: ['TableProperties','TableDelete'] }
    ],
    extraPlugins: 'font,colorbutton,justify,tableresize,tableselection,tabletools'
  });

  // ✅ Save content for any service when editor changes
  editorInstance.on('change', function () {
    if (!currentServiceType) return;
    const content = editorInstance.getData().trim();
    if (content) {
      const existing = servicesArray.find(s => s.type === currentServiceType);
      if (existing) {
        existing.content = content;
      } else {
        servicesArray.push({ type: currentServiceType, content });
      }
    }

    // ✅ If Pricing, update total price
    if (currentServiceType === "pricing") {
      updateTotalPriceFromEditor();
    }
  });
}


    const existingService = servicesArray.find(s => s.type === newType);
    editorInstance.setData(existingService ? existingService.content : "");
  } else {
    editorRow.style.display = "none";
    currentServiceType = null;
  }
}

// ===================
// Auto-calc total price from Pricing CKEditor
// ===================
function updateTotalPriceFromEditor() {
  if (!editorInstance) return;
  const content = editorInstance.getData();

  // Strip HTML tags → plain text
  const text = content.replace(/<[^>]*>/g, ' ');

  // Find all numbers
  const matches = text.match(/\d+(?:\.\d+)?/g);

  if (matches) {
    const sum = matches.reduce((acc, val) => acc + parseFloat(val), 0);
    document.getElementById("Price").value = sum.toFixed(2);
  }
}

// ===================
// Form submission
// ===================
async function handleFormSubmit(e) {
  e.preventDefault();
  if (!companyDropdown.value) { alert("Please select a company."); return; }

  // Save current editor content
  if (currentServiceType && editorInstance) {
    const content = editorInstance.getData().trim();
    if (content) {
      const existing = servicesArray.find(s => s.type === currentServiceType);
      if (existing) {
        existing.content = content;
      } else {
        servicesArray.push({ type: currentServiceType, content });
      }
    }
  }

  if (servicesArray.length === 0) { 
    alert("Please enter at least one service."); 
    return; 
  }

  const selectedCompany = companyDropdown.options[companyDropdown.selectedIndex];

  const data = {
    client_id: selectedCompany.value,
    company_name: selectedCompany.textContent,
    industry: document.getElementById("industry").value,
    person_name: document.getElementById("personName").value,
    contact: document.getElementById("Contact").value,
    email: document.getElementById("Email").value,
    website: document.getElementById("Website").value,
    address: document.getElementById("Address").value,
    description: document.getElementById("Description").value,
    price: Number(document.getElementById("Price").value) || 0,
    services: servicesArray
  };

  try {
    const url = editId 
      ? `http://127.0.0.1:8000/api/quotations/${editId}/` 
      : "http://127.0.0.1:8000/api/quotations/";

    const method = editId ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      const result = await response.json();
      alert(`Quotation ${editId ? "updated" : "saved"}! Number: ${result.quotation_number}`);
      window.location.href = "quotation.html";
    } else {
      const errorText = await response.text();
      alert("Failed to save quotation: " + errorText);
    }
  } catch (error) {
    console.error("Error submitting form:", error);
    alert("Network error while saving quotation.");
  }
}
