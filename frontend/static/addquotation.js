// ================================
// Add / Edit Quotation 
// ================================
document.addEventListener("DOMContentLoaded", async () => {

  const form = document.getElementById("quotationForm");
  const token = localStorage.getItem("authToken");

  // Redirect if token missing
  if (!token) {
    alert("Session expired. Please log in again.");
    window.location.href = "/";
    return;
  }

  // Detect Edit Mode (?id=123)
  const urlParams = new URLSearchParams(window.location.search);
  let editId = urlParams.get("id");
  let duplicateId = urlParams.get("duplicate");

  // Cancel → go back to quotation main page
  const cancelBtn = document.getElementById("cancelBtn");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      window.location.href = "/quotation";
    });
  }

  // Profile redirect
  const profileLogo = document.querySelector(".dashboard-head img");
  if (profileLogo) {
    profileLogo.addEventListener("click", () => {
      window.location.href = "/user-profile/";
    });
  }

  // Sidebar highlight
  const currentPath = window.location.pathname.toLowerCase().replace(/\/$/, "");
  const normalizedCurrent = currentPath.replace(/\.html$/, "");

  document.querySelectorAll(".nav-list .nav-link").forEach(link => {
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

  // Sidebar toggle
  const sidebar = document.getElementById("sidebar");
  const toggleBtn = document.getElementById("sidebarToggle");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", function () {
      sidebar.classList.toggle("active");
    });
  }

  // -----------------------------
  // CKEditor + Service Variables
  // -----------------------------
  const companyDropdown = document.getElementById("companyName");
  const servicesDropdown = document.getElementById("services");
  const editorRow = document.getElementById("editorRow");
  const editorLabel = document.getElementById("editorLabel");

  let editorInstance = null;
  let servicesArray = [];
  let currentServiceType = null;

  // -----------------------------
  // Load Companies
  // -----------------------------
  async function loadCompanies(selectedCompanyId = null) {
    try {
      const res = await fetch("https://crm.design-bharat.com/api/clients/", {
        headers: {
          "Authorization": `Token ${token}`,
        }
      });

      const companies = await res.json();

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

  // -----------------------------
  // Auto-fill company details
  // -----------------------------
  function handleCompanyChange() {
    const selected = this.options[this.selectedIndex];
    document.getElementById("industry").value = selected.dataset.industry || "";
    document.getElementById("personName").value = selected.dataset.person || "";
    document.getElementById("Contact").value = selected.dataset.contact || "";
    document.getElementById("Email").value = selected.dataset.email || "";
    document.getElementById("Website").value = selected.dataset.website || "";
    document.getElementById("Address").value = selected.dataset.address || "";
  }

  // -----------------------------
  // Load Quotation for Editing
  // -----------------------------
  async function loadQuotationForEdit(id) {
    try {
      const res = await fetch(`https://crm.design-bharat.com/api/quotations/${id}/`, {
        headers: {
          "Authorization": `Token ${token}`
        }
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("Error loading quotation:", errText);
        alert(`Failed to load quotation. (${res.status})`);
        return;
      }

      const q = await res.json();
      console.log("Loaded Quotation:", q);

      document.querySelector("#quotationForm button[type='submit']").textContent = "Update";

      // Load companies with preselect
      await loadCompanies(q.client);

      // Fill fixed fields
      document.getElementById("industry").value = q.industry || "";
      document.getElementById("personName").value = q.person_name || "";
      document.getElementById("Contact").value = q.contact || "";
      document.getElementById("Email").value = q.email || "";
      document.getElementById("Website").value = q.website || "";
      document.getElementById("Address").value = q.address || "";
      document.getElementById("Description").value = q.description || "";
      document.getElementById("Price").value = q.price || "";

      servicesArray = q.services || [];

      if (servicesArray.length > 0) {
        servicesDropdown.value = servicesArray[0].type;
        handleServiceChange.call(servicesDropdown);
      }

    } catch (err) {
      console.error("Error loading quotation:", err);
      alert("Failed to load quotation details.");
    }
  }
  
  // -----------------------------
// Load Quotation for Duplicate
// -----------------------------
async function loadQuotationForDuplicate(id) {
  try {
    const res = await fetch(`https://crm.design-bharat.com/api/quotations/${id}/`, {
      headers: {
        "Authorization": `Token ${token}`
      }
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Error loading quotation (duplicate):", errText);
      alert(`Failed to load quotation for duplicate. (${res.status})`);
      return;
    }

    const q = await res.json();
    console.log("Loaded Quotation for Duplicate:", q);

    // Change heading & button text (optional)
    const heading = document.querySelector(".dashboard");
    if (heading) heading.textContent = "Duplicate Quotation";

    const submitBtn = document.querySelector("#quotationForm button[type='submit']");
    if (submitBtn) submitBtn.textContent = "Save Duplicate";

    // Load companies and pre-select this client
    await loadCompanies(q.client);

    // Fill fields like edit
    document.getElementById("industry").value    = q.industry || "";
    document.getElementById("personName").value  = q.person_name || "";
    document.getElementById("Contact").value     = q.contact || "";
    document.getElementById("Email").value       = q.email || "";
    document.getElementById("Website").value     = q.website || "";
    document.getElementById("Address").value     = q.address || "";
    document.getElementById("Description").value = q.description || "";
    document.getElementById("Price").value       = q.price || "";

    // Copy services
    servicesArray = q.services || [];

    if (servicesArray.length > 0) {
      servicesDropdown.value = servicesArray[0].type;
      handleServiceChange.call(servicesDropdown);
    }

    // IMPORTANT:
    // Do NOT set editId here. We want POST (new record), not PUT.
  } catch (err) {
    console.error("Error loading quotation for duplicate:", err);
    alert("Failed to load quotation details for duplicate.");
  }
}


  // -----------------------------
  // Service Dropdown Change
  // -----------------------------
  servicesDropdown.addEventListener("change", handleServiceChange);

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

  // Create editor only once
        if (!editorInstance) {
          editorInstance = CKEDITOR.replace("editor", {
            height: 400,
            extraPlugins: 'uploadimage,colorbutton,font,justify,tableresize,tableselection',
            removePlugins: 'image2,exportpdf',
            // used by Image dialog “Upload” tab
            filebrowserUploadUrl: '/api/ckeditor-upload/',
            filebrowserUploadMethod: 'form',
            // used by drag & drop / paste (uploadimage plugin)
            uploadUrl: '/api/ckeditor-upload/',
            allowedContent: true,
            removeDialogTabs: 'image:advanced;image:Link'
          });
        
          // keep your change handler
          editorInstance.on('change', function () {
            if (!currentServiceType) return;
            const content = editorInstance.getData().trim();
            if (content) {
              const existing = servicesArray.find(s => s.type === currentServiceType);
              if (existing) existing.content = content;
              else servicesArray.push({ type: currentServiceType, content });
            }
            if (currentServiceType === "pricing") {
              updateTotalPriceFromEditor();
            }
          });
        }


      // Load saved content for this service
      const existingService = servicesArray.find(s => s.type === newType);
      editorInstance.setData(existingService ? existingService.content : "");

    } else {
      editorRow.style.display = "none";
      currentServiceType = null;
    }
  }

  // -----------------------------
  // Auto-calc Price from CKEditor
  // -----------------------------
  function updateTotalPriceFromEditor() {
    if (!editorInstance) return;
    const content = editorInstance.getData();
    const text = content.replace(/<[^>]*>/g, ' ');
    const matches = text.match(/\d+(?:\.\d+)?/g);
    if (matches) {
      const sum = matches.reduce((acc, val) => acc + parseFloat(val), 0);
      document.getElementById("Price").value = sum.toFixed(2);
    }
  }

  // -----------------------------
  // Submit Form
  // -----------------------------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!companyDropdown.value) {
      alert("Please select a company.");
      return;
    }

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
    
    if (duplicateId) {
      data.duplicate_of = Number(duplicateId);
    }

    try {

      const url = editId
        ? `https://crm.design-bharat.com/api/quotations/${editId}/`
        : "https://crm.design-bharat.com/api/quotations/";

      const method = editId ? "PUT" : "POST";

      // REQUIRED FETCH PATTERN 
      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Quotation ${editId ? "updated" : "saved"}! Number: ${result.quotation_number}`);
        window.location.href = "/quotation";
      } else {
        const errorText = await response.text();
        console.error("API Error:", errorText);
        alert("Error saving quotation. Check console for info.");
      }

    } catch (error) {
      console.error("Submit Error:", error);
      alert("Server error. Try again later.");
    }
  });

  // -----------------------------
  // Start: Load correct data
  // -----------------------------
  if (editId) {
    await loadQuotationForEdit(editId);
  } else if(duplicateId){
      await loadQuotationForDuplicate(duplicateId);
  }
  else {
    await loadCompanies();
  }
});
