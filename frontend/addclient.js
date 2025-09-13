// ===================
// Sidebar Active Menu Highlight
// ===================
const currentPage = window.location.pathname.split("/").pop().toLowerCase();
const navLinks = document.querySelectorAll('.nav-list .nav-link');
navLinks.forEach(link => {
  const linkPage = link.getAttribute('href').toLowerCase();
  if (linkPage === currentPage) {
    link.classList.add('active');
  } else {
    link.classList.remove('active');
  }
});

// ===================
// Add Client Form Submit
// ===================
document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
      company_name: document.getElementById("companyName").value,
      industry: document.getElementById("industry").value,
      person_name: document.getElementById("personName").value,
      contact_number: document.getElementById("Contact").value,   // ✅ FIXED
      email: document.getElementById("Email").value,
      website: document.getElementById("Website").value,
      address: document.getElementById("Address").value,
      gst: document.getElementById("GST").value,
      amc: document.getElementById("AMC").value,
      amc_price: document.getElementById("AMCPrice").value,
      domain_name: document.getElementById("Domain").value,     // ✅ FIXED (was domain_name)
      domain_charges: document.getElementById("DomainCharges").value,
      server_details: document.getElementById("ServerDetails").value,
      server_price: document.getElementById("ServerPrice").value,
      maintenance_value: document.getElementById("MaintenanceValue").value,
      comments: document.getElementById("Comments").value,
    };

    try {
      const response = await fetch("http://127.0.0.1:8000/api/clients/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        alert("Client saved successfully!");
        window.location.href = "Clients.html";
      } else {
        alert("Error saving client.");
      }
    } catch (err) {
      console.error(err);
      alert("Server error.");
    }
  });
});
