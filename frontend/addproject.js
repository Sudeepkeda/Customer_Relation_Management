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
  const editProjectId = localStorage.getItem("editProjectId");

  if (editProjectId) {
    // Editing existing project
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/projects/${editProjectId}/`);
      if (!res.ok) throw new Error("Failed to fetch project");
      const project = await res.json();

      // Prefill form
      document.getElementById("ProjectName").value = project.project_name || "";
      document.getElementById("description").value = project.description || "";
      document.getElementById("Serverdescription").value = project.server_description || "";
      document.getElementById("Contact").value = project.contact_number || "";
      document.getElementById("Email").value = project.email || "";
      document.getElementById("Personname").value = project.person_name || "";
      document.getElementById("projectstatus").value = project.status || "";

      document.querySelector("h1.dashboard").innerText = "Edit Project";
      document.querySelector(".custom-btn1").innerText = "Update";

      // Submit → PUT update
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const data = getFormData();

        try {
          const response = await fetch(`http://127.0.0.1:8000/api/projects/${editProjectId}/`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });

          if (response.ok) {
            alert("Project updated successfully!");
            localStorage.removeItem("editProjectId");
            window.location.href = "Projects.html";
          } else {
            alert("Error updating project.");
          }
        } catch (err) {
          console.error(err);
          alert("Server error.");
        }
      });
    } catch (err) {
      console.error(err);
      alert("Error loading project data.");
    }
  } else {
    // Adding new project
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = getFormData();

      try {
        const response = await fetch("http://127.0.0.1:8000/api/projects/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          alert("Project saved successfully!");
          window.location.href = "Projects.html";
        } else {
          alert("Error saving project.");
        }
      } catch (err) {
        console.error(err);
        alert("Server error.");
      }
    });
  }

  // ===================
  // Collect form data
  // ===================
  function getFormData() {
    return {
      project_name: document.getElementById("ProjectName").value,
      description: document.getElementById("description").value,
      server_description: document.getElementById("Serverdescription").value,
      contact_number: document.getElementById("Contact").value,
      email: document.getElementById("Email").value,
      person_name: document.getElementById("Personname").value,
      status: document.getElementById("projectstatus").value,
    };
  }
});
