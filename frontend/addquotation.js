const servicesDropdown = document.getElementById("services");
const editorRow = document.getElementById("editorRow");
const editorLabel = document.getElementById("editorLabel");
const servicesList = [];

if (!CKEDITOR.instances.editor) {
  CKEDITOR.replace("editor");
}

// Show editor
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

// Add Service
document.getElementById("addServiceBtn").addEventListener("click", () => {
  if (!servicesDropdown.value) {
    alert("Please select a service.");
    return;
  }

  const newService = {
    type: servicesDropdown.value,
    content: CKEDITOR.instances.editor.getData()
  };

  servicesList.push(newService);

  // Reset
  CKEDITOR.instances.editor.setData("");
  servicesDropdown.value = "";
  editorRow.style.display = "none";

  // Update Summary
  const serviceSummary = document.getElementById("servicesSummary");
  serviceSummary.innerHTML = servicesList
    .map((s, i) => `<li>${i + 1}. ${s.type}</li>`)
    .join("");
});

// Save Quotation
document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
      company_name: document.getElementById("companyName").value,
      industry: document.getElementById("industry").value,
      person_name: document.getElementById("personName").value,
      contact: document.getElementById("Contact").value,
      email: document.getElementById("Email").value,
      website: document.getElementById("Website").value,
      address: document.getElementById("Address").value,
      description: document.getElementById("Description").value,
      price: Number(document.getElementById("Price").value) || 0,
      services: servicesList
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
