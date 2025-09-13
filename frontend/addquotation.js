const servicesDropdown = document.getElementById("services");
const editorRow = document.getElementById("editorRow");
const editorLabel = document.getElementById("editorLabel");
const priceInput = document.getElementById("price"); // assume you have a price input

if (!CKEDITOR.instances.editor) {
  CKEDITOR.replace("editor");
}

// Show editor when a service is selected, always blank
servicesDropdown.addEventListener("change", function () {
  const selectedService = this.value;
  if (selectedService) {
    editorLabel.textContent = this.options[this.selectedIndex].text;
    editorRow.style.display = "block";

    // Clear editor and price for new service selection
    CKEDITOR.instances.editor.setData("");
    priceInput.value = "";
  } else {
    editorRow.style.display = "none";
  }
});

// ===================
// Add Quotation Form Submit
// ===================
document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Prepare services array
    const services = [
      {
        type: servicesDropdown.value,
        content: CKEDITOR.instances.editor.getData(),
        price: priceInput.value
      }
    ];

    // Collect all form data
    const data = {
      company_name: document.getElementById("companyName").value,
      industry: document.getElementById("industry").value,
      person_name: document.getElementById("personName").value,
      contact: document.getElementById("Contact").value,
      email: document.getElementById("Email").value,
      website: document.getElementById("Website").value,
      address: document.getElementById("Address").value,
      description: document.getElementById("Description").value,
      services: services // send as array to backend
    };

    try {
      const response = await fetch("http://127.0.0.1:8000/api/quotations/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Quotation saved! Number: ${result.quotation_number}, Date: ${result.quotation_date}`);
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
