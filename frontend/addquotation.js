// ===================
// DOM Elements
// ===================
const companyDropdown = document.getElementById("companyName");
const servicesDropdown = document.getElementById("services");
const editorRow = document.getElementById("editorRow");
const editorLabel = document.getElementById("editorLabel");
const serviceSummaryRow = document.getElementById("serviceSummaryRow");
const servicesSummary = document.getElementById("servicesSummary");

let editorInstance = null;
let servicesArray = [];
let currentServiceType = null;
let editId = null; // <-- to detect edit mode

// ===================
// Initialize after DOM loaded
// ===================
document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  editId = urlParams.get("id");

  if (editId) {
    const submitBtn = document.querySelector("#quotationForm button[type='submit']");
    if (submitBtn) submitBtn.textContent = "Update";
    await loadQuotationForEdit(editId);
  } else {
    await loadCompanies();
  }

  servicesDropdown.addEventListener("change", handleServiceChange);
  document.getElementById("quotationForm").addEventListener("submit", handleFormSubmit);
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

    await loadCompanies(q.client);

    document.getElementById("industry").value = q.industry || "";
    document.getElementById("personName").value = q.person_name || "";
    document.getElementById("Contact").value = q.contact || "";
    document.getElementById("Email").value = q.email || "";
    document.getElementById("Website").value = q.website || "";
    document.getElementById("Address").value = q.address || "";
    document.getElementById("Description").value = q.description || "";

    // Load services (including Pricing if present)
    servicesArray = q.services || [];
    updateSummaryUI();

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

  if (currentServiceType && editorInstance) {
    const content = editorInstance.getData().trim();
    if (content) {
      const existing = servicesArray.find(s => s.type === currentServiceType);
      if (existing) {
        existing.content = content;
      } else {
        servicesArray.push({ type: currentServiceType, content });
      }
      updateSummaryUI();
    }
  }

  if (newType) {
    editorLabel.textContent = this.options[this.selectedIndex].text;
    editorRow.style.display = "block";
    currentServiceType = newType;

    if (!editorInstance) {
      editorInstance = CKEDITOR.replace("editor", {
        height: 300,
        removePlugins: 'elementspath',
        resize_enabled: false,
        toolbar: [
          { name: 'basicstyles', items: ['Bold','Italic','Underline','Strike','RemoveFormat'] },
          { name: 'paragraph', items: ['NumberedList','BulletedList','-','Outdent','Indent','Blockquote'] },
          { name: 'links', items: ['Link','Unlink'] },
          { name: 'tools', items: ['Maximize'] }
        ]
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
// Update Service Summary list
// ===================
function updateSummaryUI() {
  servicesSummary.innerHTML = "";
  servicesArray.forEach(s => {
    const typeText = document.querySelector(`#services option[value="${s.type}"]`)?.text || s.type;
    const li = document.createElement("li");
    li.innerHTML = `<strong>${typeText}:</strong> ${s.content.substring(0, 60)}...`;
    servicesSummary.appendChild(li);
  });
  serviceSummaryRow.style.display = servicesArray.length > 0 ? "block" : "none";
}

// ===================
// Form submission
// ===================
async function handleFormSubmit(e) {
  e.preventDefault();
  if (!companyDropdown.value) { alert("Please select a company."); return; }

  if (currentServiceType && editorInstance) {
    const content = editorInstance.getData().trim();
    if (content) {
      const existing = servicesArray.find(s => s.type === currentServiceType);
      if (existing) {
        existing.content = content;
      } else {
        servicesArray.push({ type: currentServiceType, content });
      }
      updateSummaryUI();
    }
  }

  if (servicesArray.length === 0) { 
    alert("Please enter at least one service (About, Tech, Scope, or Pricing)."); 
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
    services: servicesArray   // ✅ includes Pricing if selected
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
