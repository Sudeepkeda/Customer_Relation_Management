// ===========================
// Add / Edit Updation 
// ===========================
document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("updationForm");
  const token = localStorage.getItem("authToken");

  // Redirect if not logged in
  if (!token) {
    alert("Session expired. Please log in again.");
    window.location.href = "/";
    return;
  }

  // -----------------------
  // Cancel Button
  // -----------------------
  const cancelBtn = document.getElementById("cancelBtn");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      sessionStorage.removeItem("editUpdationId");
      window.location.href = "/updation";
    });
  }

  // Profile logo redirect
  const profileLogo = document.querySelector(".dashboard-head img");
  if (profileLogo) {
    profileLogo.addEventListener("click", () => {
      window.location.href = "/user-profile/";
    });
  }

  // Sidebar Toggle
  const sidebar = document.getElementById("sidebar");
  const toggleBtn = document.getElementById("sidebarToggle");
  if (toggleBtn) toggleBtn.addEventListener("click", () => sidebar.classList.toggle("active"));

  // Sidebar Active Menu Highlight
  const currentPath = window.location.pathname.toLowerCase().replace(/\/$/, "");
  const normalizedCurrent = currentPath.replace(/\.html$/, "");

  document.querySelectorAll(".nav-list .nav-link").forEach(link => {
    const linkHref = link.getAttribute("href").toLowerCase().replace(/\/$/, "");
    const normalizedHref = linkHref.replace(/\.html$/, "");

    if (normalizedCurrent === normalizedHref || normalizedCurrent.startsWith(normalizedHref + "/")) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });

  // ==============================
  // Load Updation for Editing
  // ==============================
   const editId = sessionStorage.getItem("editUpdationId");

  if (editId) {
    try {
      console.log("Editing Updation ID:", editId);
      const response = await fetch(`https://crm.design-bharat.com/api/updations/${editId}/`, {
        headers: {
          "Authorization": `Token ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        alert("Failed to load updation details.");
        sessionStorage.removeItem("editUpdationId");
        return;
      }

      const updation = await response.json();

      // Fill form
      document.getElementById("clientName").value = updation.client_name || "";
      document.getElementById("projectName").value = updation.project_name || "";
      document.getElementById("Status").value = updation.status || "";
      document.getElementById("description").value = updation.description || "";

      // NEW: fill date input (if exists)
      if (document.getElementById("date")) {
        // Accept iso date (YYYY-MM-DD) or fallback to created_at
        let dateValue = "";
        if (updation.date) dateValue = updation.date;
        else if (updation.created_at) dateValue = new Date(updation.created_at).toISOString().split("T")[0];
        document.getElementById("date").value = dateValue;
      }

      // Optional: Update UI to show Edit mode
      document.querySelector("h1.dashboard") && (document.querySelector("h1.dashboard").innerText = "Edit Updation");
      const submitBtn = form.querySelector("button[type='submit']");
      if (submitBtn) submitBtn.innerText = "Update";

      // Clean up after loading (optional but safe)
      sessionStorage.removeItem("editUpdationId");

    } catch (err) {
      console.error("Error loading updation:", err);
      alert("Failed to load data.");
      sessionStorage.removeItem("editUpdationId");
    }
  } else {
    form.reset();
  }
  // -----------------------
  // Form Submit
  // -----------------------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Collect date from the date input; fallback to today's date if empty
    const dateInput = document.getElementById("date");
    const dateValue = dateInput && dateInput.value ? dateInput.value : new Date().toISOString().split("T")[0];

    const data = {
      client_name: document.getElementById("clientName").value.trim(),
      project_name: document.getElementById("projectName").value.trim(),
      status: document.getElementById("Status").value.trim(),
      description: document.getElementById("description").value.trim(),
      date: dateValue
    };

    try {
      const url = editId
        ? `https://crm.design-bharat.com/api/updations/${editId}/`
        : "https://crm.design-bharat.com/api/updations/";

      const method = editId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        alert(editId ? "Updation updated successfully!" : "Updation added successfully!");
        sessionStorage.removeItem("editUpdationId");  // Final cleanup
        window.location.href = "/updation";
      } else {
        const err = await response.text();
        alert("Error: " + err);
      }
    } catch (err) {
      console.error(err);
      alert("Server error.");
    }
  });
});