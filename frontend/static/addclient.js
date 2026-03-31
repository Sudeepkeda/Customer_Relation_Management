// ===================
// Add/Edit Enquiry
// ===================
document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("clientForm");
  const editId = localStorage.getItem("editClientId");
  const token = localStorage.getItem("authToken");
  const BASE_URL = window.location.origin;

  // Redirect to login if not authenticated
  if (!token) {
   // alert("Session expired. Please log in again.");
    window.location.href = "/";
    return;
  }

  // Cancel Button → Go back to clienet page
  const cancelBtn = document.getElementById("cancelBtn");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      window.location.href = "/clients";
    });
  }

  // Profile logo redirect
  const profileLogo = document.querySelector(".dashboard-head img");
  if (profileLogo) {
    profileLogo.addEventListener("click", () => {
      window.location.href = "/user-profile/";
    });
  }

  // Sidebar Active Menu Highlight
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

  // Sidebar Toggle
  const sidebar = document.getElementById("sidebar");
  const toggleBtn = document.getElementById("sidebarToggle");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", function () {
      sidebar.classList.toggle("active");
    });
  }

  // AMC Price → allow numbers only
const amcPriceInput = document.getElementById("AMCPrice");
if (amcPriceInput) {
  amcPriceInput.addEventListener("input", function () {
    this.value = this.value.replace(/\D/g, "");
  });
}

  // Domain charges → allow numbers only
const domainPriceInput = document.getElementById("DomainCharges");
if (domainPriceInput) {
  domainPriceInput.addEventListener("input", function () {
    this.value = this.value.replace(/\D/g, "");
  });
}

//For server price
const serverPriceInput = document.getElementById("ServerPrice");
if (serverPriceInput) {
  serverPriceInput.addEventListener("input", function () {
    this.value = this.value.replace(/\D/g, "");
  });
}

//For maitenance
const maitenancePriceInput = document.getElementById("MaintenanceValue");
if (maitenancePriceInput) {
  maitenancePriceInput.addEventListener("input", function () {
    this.value = this.value.replace(/\D/g, "");
  });
}

  if (editId) {
    // Editing existing client 
    try {
      console.log("Trying to load Client ID:", editId);
      const res = await fetch(`${BASE_URL}/api/clients/${editId}/`,{
           headers: {
          "Authorization": `Token ${token}`,
          "Content-Type": "application/json",
        },
      });
       console.log("Status:", res.status);
         if (!res.ok) {
                const errText = await res.text();
                console.error("Error Response:", errText);
               // alert(`Failed to load client for editing. (${res.status})`);
                return;
              }
        
              const client = await res.json();
              console.log("Loaded client:", client);

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
      document.getElementById("Domainstdate").value = client.domain_start_date || "";
      document.getElementById("Domainendate").value = client.domain_end_date || "";
      document.getElementById("Serverstdate").value = client.server_start_date || "";
      document.getElementById("Serverendate").value = client.server_end_date || "";
      document.getElementById("Maintenancestartdate").value = client.maintenance_start_date || "";
      document.getElementById("MaintenanceEnddate").value = client.maintenance_end_date || "";
      document.getElementById("Priority").value = client.priority || "";
      document.getElementById("Status").value = client.status || "";
      document.querySelector("h1.dashboard").innerText = "Edit Client";
      document.querySelector(".custom-btn1").innerText = "Update";
       
        } catch (err) {
              console.error("Error loading clients:", err);
             // alert("Failed to load clients details.");
            }
          }


      // Submit → PUT update
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const data = getFormData();

        try {
            
             let url = `${BASE_URL}/api/clients/`;
      let method = "POST";

      if (editId) {
        url += `${editId}/`;
        method = "PUT";
      }

           const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${token}`,
        },
        body: JSON.stringify(data),
      });

         if (response.ok) {
       // alert(editId ? "Client updated successfully!" : "Client saved successfully!");
        localStorage.removeItem("editClientId");
        window.location.href = "/clients";
      } else {
        const errorText = await response.text();
        console.error("API Error:", errorText);
        alert(`Error saving client: ${errorText}`);
      }
    } catch (err) {
      console.error(err);
      //alert("Server error. Please try again later.");
    }
  });

  function getFormData() {
    const strOrNull = (v) => {
      const s = (v ?? "").toString().trim();
      return s === "" ? null : s;
    };
    const numOrNull = (v) => {
      const s = (v ?? "").toString().trim();
      if (!s) return null;
      const n = Number(s);
      return Number.isFinite(n) ? n : null;
    };
    const dateOrNull = (v) => {
      const s = (v ?? "").toString().trim();
      return s === "" ? null : s; // keep as YYYY-MM-DD
    };

    const payload = {
      company_name: strOrNull(document.getElementById("companyName")?.value),
      industry: strOrNull(document.getElementById("industry")?.value),
      person_name: strOrNull(document.getElementById("personName")?.value),
      contact_number: strOrNull(document.getElementById("Contact")?.value),
      email: strOrNull(document.getElementById("Email")?.value),
      website: strOrNull(document.getElementById("Website")?.value),
      address: strOrNull(document.getElementById("Address")?.value),
      gst: strOrNull(document.getElementById("GST")?.value),
      amc: strOrNull(document.getElementById("AMC")?.value),

      // Numbers / decimals: send null when blank ("" breaks API)
      amc_price: numOrNull(document.getElementById("AMCPrice")?.value),
      domain_charges: numOrNull(document.getElementById("DomainCharges")?.value),
      server_price: numOrNull(document.getElementById("ServerPrice")?.value),
      maintenance_value: numOrNull(document.getElementById("MaintenanceValue")?.value),

      domain_name: strOrNull(document.getElementById("Domain")?.value),
      domain_start_date: dateOrNull(document.getElementById("Domainstdate")?.value),
      domain_end_date: dateOrNull(document.getElementById("Domainendate")?.value),

      server_details: strOrNull(document.getElementById("ServerDetails")?.value),
      server_start_date: dateOrNull(document.getElementById("Serverstdate")?.value),
      server_end_date: dateOrNull(document.getElementById("Serverendate")?.value),

      maintenance_start_date: dateOrNull(document.getElementById("Maintenancestartdate")?.value),
      maintenance_end_date: dateOrNull(document.getElementById("MaintenanceEnddate")?.value),

      comments: strOrNull(document.getElementById("Comments")?.value),
    };

    // If Priority/Status not selected, omit so backend default/NULL applies
    const priorityVal = (document.getElementById("Priority")?.value ?? "").toString().trim();
    if (priorityVal) payload.priority = priorityVal;

    const statusVal = (document.getElementById("Status")?.value ?? "").toString().trim();
    if (statusVal) payload.status = statusVal;

    return payload;
  }
});
