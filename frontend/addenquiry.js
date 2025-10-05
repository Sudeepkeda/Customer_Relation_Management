// ===================
// Add/Edit Enquiry
// ===================
document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("enquiryForm");
  const editId = localStorage.getItem("editEnquiryId");

  // Cancel Button → Go back to Clients.html
const cancelBtn = document.getElementById("cancelBtn");
if (cancelBtn) {
  cancelBtn.addEventListener("click", () => {
    window.location.href = "enquiry.html";
  });
}


  // ===================
// Sidebar Active Menu Highlight
// ===================
const currentPage = window.location.pathname.split("/").pop().toLowerCase();
const navLinks = document.querySelectorAll('.nav-list .nav-link');

navLinks.forEach(link => {
  const linkPage = link.getAttribute('href').toLowerCase();

  // ✅ Highlight "Projects" also when on addproject.html
  if (
    linkPage === currentPage ||
    (currentPage === "addenquiry.html" && linkPage === "enquiry.html")
  ) {
    link.classList.add('active');
  } else {
    link.classList.remove('active');
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
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/enquiries/${editId}/`);
      if (!response.ok) throw new Error("Failed to fetch enquiry details");

      const enquiry = await response.json();
      // Fill form fields
      document.getElementById("companyName").value = enquiry.company_name || "";
      document.getElementById("personName").value = enquiry.person_name || "";
      document.getElementById("Contact").value = enquiry.contact_number || "";
      document.getElementById("Email").value = enquiry.email || "";
      document.getElementById("Website").value = enquiry.website || "";
      document.getElementById("Status").value = enquiry.status || "";
      document.getElementById("Comments").value = enquiry.comments || "";
    } catch (err) {
      console.error(err);
      alert("Failed to load enquiry for editing.");
    }
  }

  // -------------------
  // Form submission
  // -------------------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = getFormData();

    try {
      let url = "http://127.0.0.1:8000/api/enquiries/";
      let method = "POST";

      if (editId) {
        url += `${editId}/`;
        method = "PUT"; // Use PUT for editing existing entry
      }

      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        alert(editId ? "Enquiry updated successfully!" : "Enquiry saved successfully!");
        localStorage.removeItem("editEnquiryId");
        window.location.href = "enquiry.html";
      } else {
        alert("Error saving enquiry.");
      }
    } catch (err) {
      console.error(err);
      alert("Server error.");
    }
  });

  // -------------------
  // Collect form data
  // -------------------
  function getFormData() {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    return {
      company_name: document.getElementById("companyName").value,
      person_name: document.getElementById("personName").value,
      contact_number: document.getElementById("Contact").value,
      email: document.getElementById("Email").value,
      website: document.getElementById("Website").value,
      status: document.getElementById("Status").value,
      comments: document.getElementById("Comments").value,
      date: today
    };
  }
});
