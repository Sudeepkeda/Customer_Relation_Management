document.addEventListener("DOMContentLoaded", async () => {
    const form = document.querySelector("form");
    const personDropdown = document.getElementById("PersonName");
    const contactInput = document.getElementById("Contact");
    const emailInput = document.getElementById("Email");

    let personsData = [];


    // Cancel Button → Go back to Clients.html
const cancelBtn = document.getElementById("cancelBtn");
if (cancelBtn) {
  cancelBtn.addEventListener("click", () => {
    window.location.href = "Projects.html";
  });
}

const profileLogo = document.querySelector(".dashboard-head img");
  if (profileLogo) {
    profileLogo.addEventListener("click", () => {
      window.location.href = "profile.html";
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
    (currentPage === "addproject.html" && linkPage === "projects.html")
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


    // ===================
    // Load persons from quotations
    // ===================
    async function loadPersons(selectedPerson = null) {
        try {
            const res = await fetch("http://127.0.0.1:8000/api/quotations/");
            personsData = await res.json();

            personDropdown.innerHTML = '<option value="">-- Select Person --</option>';
            personsData.forEach(p => {
                const option = document.createElement("option");
                option.value = p.person_name;
                option.text = p.person_name; // visible text
                option.dataset.contact = p.contact || "";
                option.dataset.email = p.email || "";
                personDropdown.appendChild(option);
            });

            if (selectedPerson) {
                personDropdown.value = selectedPerson;
                handlePersonChange();
            }
        } catch (err) {
            console.error("Failed to load persons:", err);
        }
    }

    function handlePersonChange() {
        const selected = personDropdown.options[personDropdown.selectedIndex];
        contactInput.value = selected.dataset.contact || "";
        emailInput.value = selected.dataset.email || "";
    }

    personDropdown.addEventListener("change", handlePersonChange);

    // ===================
    // Check for Edit Project in sessionStorage
    // ===================
    const editProject = JSON.parse(sessionStorage.getItem("editProject") || "null");
    if (editProject) {
        document.getElementById("ProjectName").value = editProject.project_name || "";
        document.getElementById("description").value = editProject.description || "";
        document.getElementById("ServerName").value = editProject.server_name || "";
        document.getElementById("projectstatus").value = editProject.status || "";

        await loadPersons(editProject.person_name); // pre-select person

        document.querySelector("h1.dashboard").innerText = "Edit Project";
        document.querySelector(".custom-btn1").innerText = "Update";

        // Optional: remove from sessionStorage after pre-filling
        sessionStorage.removeItem("editProject");
    } else {
        await loadPersons();
    }

    // ===================
    // Form submission
    // ===================
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const data = {
            project_name: document.getElementById("ProjectName").value,
            description: document.getElementById("description").value,
            server_name: document.getElementById("ServerName").value,
            contact_number: contactInput.value,
            email: emailInput.value,
            person_name: personDropdown.value,
            status: document.getElementById("projectstatus").value
        };

        try {
            const url = editProject 
                ? `http://127.0.0.1:8000/api/projects/${editProject.id}/`
                : "http://127.0.0.1:8000/api/projects/";
            const method = editProject ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                alert(editProject ? "Project updated!" : "Project saved!");
                window.location.href = "Projects.html";
            } else {
                const errText = await res.text();
                alert("Error: " + errText);
            }
        } catch (err) {
            console.error(err);
            alert("Server error.");
        }
    });
});
