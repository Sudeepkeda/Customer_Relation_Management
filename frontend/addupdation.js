document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("enquiryForm");
  const saveBtn = document.querySelector('button[type="submit"]');


  
const currentPage = window.location.pathname.split("/").pop().toLowerCase();
const navLinks = document.querySelectorAll('.nav-list .nav-link');
navLinks.forEach(link => {
  const linkPage = link.getAttribute('href').toLowerCase();
  if (
    linkPage === currentPage ||
    (currentPage === "addupdation.html" && linkPage === "updation.html")
  ) {
    link.classList.add('active');
  } else {
    link.classList.remove('active');
  }
});

// Cancel Button → Go back to Clients.html
const cancelBtn = document.getElementById("cancelBtn");
if (cancelBtn) {
  cancelBtn.addEventListener("click", () => {
    window.location.href = "Clients.html";
  });
}



  // Sidebar Toggle
  const sidebar = document.getElementById("sidebar");
  const toggleBtn = document.getElementById("sidebarToggle");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", function () {
      sidebar.classList.toggle("active");
    });
  }


  // Parse URL for ?edit=ID or ?view=ID
  const params = new URLSearchParams(window.location.search);
  const editId = params.get("edit");
  const viewId = params.get("view");

  // If editing or viewing, load existing data
  if (editId || viewId) {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/updations/${editId || viewId}/`);
      const data = await res.json();

      // Fill form fields
      document.getElementById("clientName").value = data.client_name;
      document.getElementById("projectName").value = data.project_name;
      document.getElementById("Status").value = data.status;
      document.getElementById("description").value = data.description || "";

      // If view mode, disable inputs and hide save button
      if (viewId) {
        form.querySelectorAll("input, textarea, select").forEach(el => el.disabled = true);
        saveBtn.style.display = "none";
      }
    } catch (err) {
      console.error("Error loading updation:", err);
      alert("Failed to load record.");
    }
  }

  // Handle Save / Update
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
      client_name: document.getElementById("clientName").value.trim(),
      project_name: document.getElementById("projectName").value.trim(),
      status: document.getElementById("Status").value.trim(),
      description: document.getElementById("description").value.trim(),
    };

    if (!data.client_name || !data.project_name || !data.status) {
      alert("Please fill all required fields.");
      return;
    }

    try {
      const url = editId
        ? `http://127.0.0.1:8000/api/updations/${editId}/`
        : "http://127.0.0.1:8000/api/updations/";

      const method = editId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        alert(editId ? "Updation updated successfully!" : "Updation added successfully!");
        window.location.href = "updation.html";
      } else {
        const errData = await res.json();
        console.error(errData);
        alert("Failed to save updation.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong!");
    }
  });

  // Cancel button → go back
  cancelBtn.addEventListener("click", () => {
    window.location.href = "updation.html";
  });
});
