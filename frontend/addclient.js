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

document.addEventListener("DOMContentLoaded", async () => {
  const form = document.querySelector("form");
  const editClientId = localStorage.getItem("editClientId");

  if (editClientId) {
    // Editing existing client
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/clients/${editClientId}/`);
      if (!res.ok) throw new Error("Failed to fetch client");
      const client = await res.json();

      // Prefill form
      document.getElementById("companyName").value = client.company_name || "";
      document.getElementById("industry").value = client.industry || "";
      document.getElementById("personName").value = client.person_name || "";
      document.getElementById("Contact").value = client.contact_number || "";
      document.getElementById("Email").value = client.email || "";
      document.getElementById("Website").value = client.website || "";
      document.getElementById("Address").value = client.address || "";
      document.getElementById("GST").value = client.gst || "";
      document.getElementById("AMC").value = client.amc || "";
      document.getElementById("AMCPrice").value = client.amc_price || "";
      document.getElementById("Domain").value = client.domain_name || "";
      document.getElementById("DomainCharges").value = client.domain_charges || "";
      document.getElementById("ServerDetails").value = client.server_details || "";
      document.getElementById("ServerPrice").value = client.server_price || "";
      document.getElementById("MaintenanceValue").value = client.maintenance_value || "";
      document.getElementById("Comments").value = client.comments || "";

      document.querySelector("h1.dashboard").innerText = "Edit Client";
      document.querySelector(".custom-btn1").innerText = "Update";

      // Submit → PUT update
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const data = getFormData();

        try {
          const response = await fetch(`http://127.0.0.1:8000/api/clients/${editClientId}/`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });

          if (response.ok) {
            alert("Client updated successfully!");
            localStorage.removeItem("editClientId");
            window.location.href = "Clients.html";
          } else {
            alert("Error updating client.");
          }
        } catch (err) {
          console.error(err);
          alert("Server error.");
        }
      });
    } catch (err) {
      console.error(err);
      alert("Error loading client data.");
    }
  } else {
    // Adding new client
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = getFormData();

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
  }

  function getFormData() {
    return {
      company_name: document.getElementById("companyName").value,
      industry: document.getElementById("industry").value,
      person_name: document.getElementById("personName").value,
      contact_number: document.getElementById("Contact").value,
      email: document.getElementById("Email").value,
      website: document.getElementById("Website").value,
      address: document.getElementById("Address").value,
      gst: document.getElementById("GST").value,
      amc: document.getElementById("AMC").value,
      amc_price: document.getElementById("AMCPrice").value,
      domain_name: document.getElementById("Domain").value,
      domain_charges: document.getElementById("DomainCharges").value,
      server_details: document.getElementById("ServerDetails").value,
      server_price: document.getElementById("ServerPrice").value,
      maintenance_value: document.getElementById("MaintenanceValue").value,
      comments: document.getElementById("Comments").value,
    };
  }
});
