const companyDropdown = document.getElementById("companyName");
const servicesDropdown = document.getElementById("services");
const editorRow = document.getElementById("editorRow");
const editorLabel = document.getElementById("editorLabel");
const servicesList = [];

// Initialize CKEditor
if (!CKEDITOR.instances.editor) {
  CKEDITOR.replace("editor");
}

// Load companies from API
async function loadCompanies() {
  try {
    const response = await fetch("http://127.0.0.1:8000/api/clients/");
    if (!response.ok) throw new Error("Failed to fetch companies");

    const companies = await response.json();

    companies.forEach((c) => {
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
  } catch (err) {
    console.error("Error loading companies:", err);
  }
}

// Auto-fill fields when selecting a company
companyDropdown.addEventListener("change", function () {
  const selected = this.options[this.selectedIndex];
  if (selected.value) {
    document.getElementById("industry").value = selected.dataset.industry;
    document.getElementById("personName").value = selected.dataset.person;
    document.getElementById("Contact").value = selected.dataset.contact;
    document.getElementById("Email").value = selected.dataset.email;
    document.getElementById("Website").value = selected.dataset.website;
    document.getElementById("Address").value = selected.dataset.address;
  } else {
    document.getElementById("industry").value = "";
    document.getElementById("personName").value = "";
    document.getElementById("Contact").value = "";
    document.getElementById("Email").value = "";
    document.getElementById("Website").value = "";
    document.getElementById("Address").value = "";
  }
});

// Show CKEditor for services
servicesDropdown.addEventListener("change", function () {
  const selectedService = this.value;
  if (selectedService) {
    editorLabel.textContent = this.options[this.selectedIndex].text;
    editorRow.style.display = "block";
    CKEDITOR.instances.editor.setData("");
  } else {
    editorRow.style.display = "none";
  }
});

// Save Quotation
document.addEventListener("DOMContentLoaded", () => {
  loadCompanies(); // load dropdown options

  const form = document.querySelector("form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const selectedCompany = companyDropdown.options[companyDropdown.selectedIndex];

    const data = {
      company_id: selectedCompany.value, // backend can use this if linked
      company_name: selectedCompany.textContent,
      industry: document.getElementById("industry").value,
      person_name: document.getElementById("personName").value,
      contact: document.getElementById("Contact").value,
      email: document.getElementById("Email").value,
      website: document.getElementById("Website").value,
      address: document.getElementById("Address").value,
      description: document.getElementById("Description").value,
      price: Number(document.getElementById("Price").value) || 0,
      service: {
        type: servicesDropdown.value,
        content: CKEDITOR.instances.editor.getData(),
      },
    };

    try {
      const response = await fetch("http://127.0.0.1:8000/api/quotations/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        alert(
          `Quotation saved! Number: ${result.quotation_number}, Date: ${result.quotation_date}`
        );
        window.location.href = "quotation.html";
      } else {
        const errorText = await response.text();
        alert("Error saving quotation: " + errorText);
      }
    } catch (err) {
      console.error(err);
      alert("Server error.");
    }
  });
});
