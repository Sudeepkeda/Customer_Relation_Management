// ===================
// Add/Edit Enquiry
// ===================
document.addEventListener("DOMContentLoaded", async () => {
  const BASE_URL = window.location.origin;
  const form = document.getElementById("enquiryForm");
  const editId = localStorage.getItem("editEnquiryId");
  const token = localStorage.getItem("authToken");
  const pageTitle = document.getElementById("pageTitle");

  // Redirect to login if not authenticated
  if (!token) {
    alert("Session expired. Please log in again.");
    window.location.href = "/";
    return;
  }

  // Cancel Button → Go back to Enquiry page
  const cancelBtn = document.getElementById("cancelBtn");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      window.location.href = "/enquiry";
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

  // -------------------
  // If editing, fetch existing data
  // -------------------
  if (editId) {
    if (pageTitle) pageTitle.textContent = "Edit Enquiry";
    try {
      console.log("Trying to load enquiry ID:", editId);
      const response = await fetch(`${BASE_URL}/api/enquiries/${editId}/`, {
        headers: {
          "Authorization": `Token ${token}`,
          "Content-Type": "application/json",
        },
      });
      console.log("Status:", response.status);

      if (!response.ok) {
        const errText = await response.text();
        console.error("Error Response:", errText);
        alert(`Failed to load enquiry for editing. (${response.status})`);
        return;
      }

      const enquiry = await response.json();
      console.log("Loaded Enquiry:", enquiry);

      // Fill form fields
      document.getElementById("companyName").value = enquiry.company_name || "";
      document.getElementById("personName").value = enquiry.person_name || "";
      document.getElementById("Contact").value = enquiry.contact_number || "";
      document.getElementById("Email").value = enquiry.email || "";
      document.getElementById("Website").value = enquiry.website || "";
      document.getElementById("Status").value = enquiry.status || "";
      document.getElementById("Comments").value = enquiry.comments || "";
    } catch (err) {
      console.error("Error loading enquiry:", err);
      alert("Failed to load enquiry details.");
    }
  } else {
    if (pageTitle) pageTitle.textContent = "Add New Enquiry";
  }

  // -------------------
  // Form submission
  // -------------------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = getFormData();

    try {
      let url = `${BASE_URL}/api/enquiries/`;
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
       // alert(editId ? "Enquiry updated successfully!" : "Enquiry saved successfully!");
        localStorage.removeItem("editEnquiryId");
        window.location.href = "/enquiry";
      } else {
        const errorText = await response.text();
        console.error("API Error:", errorText);
        alert(`Error saving enquiry: ${errorText}`);
      }
    } catch (err) {
      console.error(err);
      alert("Server error. Please try again later.");
    }
  });

  // -------------------
  // Collect form data
  // -------------------
  function getFormData() {
    const strOrNull = (v) => {
      const s = (v ?? "").toString().trim();
      return s === "" ? null : s;
    };

    const payload = {
      company_name: strOrNull(document.getElementById("companyName")?.value),
      person_name: strOrNull(document.getElementById("personName")?.value),
      contact_number: strOrNull(document.getElementById("Contact")?.value),
      email: strOrNull(document.getElementById("Email")?.value),
      website: strOrNull(document.getElementById("Website")?.value),
      comments: strOrNull(document.getElementById("Comments")?.value),
    };

    // If status is not selected, omit it so backend default applies
    const statusVal = (document.getElementById("Status")?.value ?? "").toString().trim();
    if (statusVal) payload.status = statusVal;

    // Provide date so DRF doesn't treat it as required (auto_now_add in model)
    const today = new Date().toISOString().split("T")[0];
    payload.date = today;

    return payload;
  }
}); // Properly closes the event listener
