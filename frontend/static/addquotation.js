// ================================
// Add / Edit Quotation
// ================================
document.addEventListener("DOMContentLoaded", async () => {

  const BASE_URL = "https://crm.design-bharat.com";

  const form = document.getElementById("quotationForm");
  const token = localStorage.getItem("authToken");
  const companyDropdown = document.getElementById("companyName");

  if (!token) {
    window.location.href = "/";
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  let editId = urlParams.get("id");
  let duplicateId = urlParams.get("duplicate");

  let servicesArray = [];

  const servicesList = [
    { type: "about", label: "About Us" },
    { type: "technicaldata", label: "Technical Details of Design Services" },
    { type: "outofscope", label: "Out Of Scope" },
    { type: "pricing", label: "Pricing" }
  ];

  let editors = {};

  // =============================
  // Sidebar + Navigation
  // =============================
  const cancelBtn = document.getElementById("cancelBtn");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      window.location.href = "/quotation";
    });
  }

  const profileLogo = document.querySelector(".dashboard-head img");
  if (profileLogo) {
    profileLogo.addEventListener("click", () => {
      window.location.href = "/user-profile/";
    });
  }

  const sidebar = document.getElementById("sidebar");
  const toggleBtn = document.getElementById("sidebarToggle");

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      sidebar.classList.toggle("active");
    });
  }

  // =============================
  // Load Companies
  // =============================
  async function loadCompanies(selectedCompanyId = null) {

    try {

      const res = await fetch(`${BASE_URL}/api/clients/`, {
        headers: { "Authorization": `Token ${token}` }
      });

      const companies = await res.json();

      companyDropdown.innerHTML =
        '<option value="">-- Select Company --</option>';

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
        companyDropdown.value = selectedCompanyId;
        handleCompanyChange.call(companyDropdown);
      }

      companyDropdown.addEventListener("change", handleCompanyChange);

    } catch (error) {
      console.error("Error loading companies:", error);
    }

  }

  // =============================
  // Auto Fill Company Details
  // =============================
  function handleCompanyChange() {

    const selected = this.options[this.selectedIndex];

    document.getElementById("industry").value =
      selected.dataset.industry || "";

    document.getElementById("personName").value =
      selected.dataset.person || "";

    document.getElementById("Contact").value =
      selected.dataset.contact || "";

    document.getElementById("Email").value =
      selected.dataset.email || "";

    document.getElementById("Website").value =
      selected.dataset.website || "";

    document.getElementById("Address").value =
      selected.dataset.address || "";

  }

  // =============================
  // Render CKEditor Services
  // =============================
  function renderServices() {

    const container = document.getElementById("servicesContainer");

    container.innerHTML = "";

    servicesList.forEach(service => {

      const block = document.createElement("div");
      block.className = "mb-4";

    block.innerHTML = `
<div class="row">
  <div class="col-12">
    <label class="form-label fw-bold">${service.label}</label>
    <textarea id="editor_${service.type}"></textarea>
  </div>
</div>
`;

      container.appendChild(block);

      const editor = CKEDITOR.replace(`editor_${service.type}`, {
        height: 350,
        extraPlugins:
          "uploadimage,colorbutton,font,justify,tableresize,tableselection",
        removePlugins: "image2,exportpdf",
        filebrowserUploadUrl: "/api/ckeditor-upload/",
        filebrowserUploadMethod: "form",
        uploadUrl: "/api/ckeditor-upload/",
        allowedContent: true,
        removeDialogTabs: "image:advanced;image:Link"
      });

      editors[service.type] = editor;

      editor.on("change", () => {

        const content = editor.getData().trim();

        const existing =
          servicesArray.find(s => s.type === service.type);

        if (existing) {
          existing.content = content;
        } else {
          servicesArray.push({
            type: service.type,
            content: content
          });
        }

        if (service.type === "pricing") {
          updateTotalPriceFromEditor(editor);
        }

      });

    });

  }

  // =============================
  // Auto Calculate Price
  // =============================
  function updateTotalPriceFromEditor(editor) {

    const content = editor.getData();

    const text = content.replace(/<[^>]*>/g, " ");

    const matches = text.match(/\d+(?:\.\d+)?/g);

    if (matches) {

      const sum = matches.reduce(
        (acc, val) => acc + parseFloat(val),
        0
      );

      document.getElementById("Price").value =
        sum.toFixed(2);

    }

  }

  // =============================
  // Load Quotation For Edit
  // =============================
  async function loadQuotationForEdit(id) {

    try {

      const res = await fetch(`${BASE_URL}/api/quotations/${id}/`, {
        headers: { "Authorization": `Token ${token}` }
      });

      const q = await res.json();

      await loadCompanies(q.client);

      document.getElementById("industry").value =
        q.industry || "";

      document.getElementById("personName").value =
        q.person_name || "";

      document.getElementById("Contact").value =
        q.contact || "";

      document.getElementById("Email").value =
        q.email || "";

      document.getElementById("Website").value =
        q.website || "";

      document.getElementById("Address").value =
        q.address || "";

      document.getElementById("Description").value =
        q.description || "";

      document.getElementById("Price").value =
        q.price || "";

      servicesArray = q.services || [];

      setTimeout(() => {

        servicesArray.forEach(service => {

          if (editors[service.type]) {
            editors[service.type].setData(
              service.content || ""
            );
          }

        });

      }, 500);

    } catch (err) {
      console.error("Error loading quotation:", err);
    }

  }

  // =============================
  // Duplicate Quotation
  // =============================
  async function loadQuotationForDuplicate(id) {

    try {

      const res = await fetch(`${BASE_URL}/api/quotations/${id}/`, {
        headers: { "Authorization": `Token ${token}` }
      });

      const q = await res.json();

      await loadCompanies(q.client);

      document.getElementById("industry").value =
        q.industry || "";

      document.getElementById("personName").value =
        q.person_name || "";

      document.getElementById("Contact").value =
        q.contact || "";

      document.getElementById("Email").value =
        q.email || "";

      document.getElementById("Website").value =
        q.website || "";

      document.getElementById("Address").value =
        q.address || "";

      document.getElementById("Description").value =
        q.description || "";

      document.getElementById("Price").value =
        q.price || "";

      servicesArray = q.services || [];

      setTimeout(() => {

        servicesArray.forEach(service => {

          if (editors[service.type]) {
            editors[service.type].setData(
              service.content || ""
            );
          }

        });

      }, 500);

    } catch (err) {
      console.error("Duplicate load error:", err);
    }

  }

  // =============================
  // Submit Form
  // =============================
  form.addEventListener("submit", async (e) => {

    e.preventDefault();

    if (!companyDropdown.value) return;

    const selectedCompany =
      companyDropdown.options[companyDropdown.selectedIndex];

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

      const url =
        editId
          ? `${BASE_URL}/api/quotations/${editId}/`
          : `${BASE_URL}/api/quotations/`;

      const method = editId ? "PUT" : "POST";

      const response = await fetch(url, {

        method: method,

        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${token}`
        },

        body: JSON.stringify(data)

      });

      if (response.ok) {

        window.location.href = "/quotation";

      } else {

        const err = await response.text();
        console.error("API Error:", err);

      }

    } catch (error) {

      console.error("Submit Error:", error);

    }

  });

  // =============================
  // Start Page
  // =============================
  renderServices();

  if (editId) {
    await loadQuotationForEdit(editId);
  }
  else if (duplicateId) {
    await loadQuotationForDuplicate(duplicateId);
  }
  else {
    await loadCompanies();
  }

});