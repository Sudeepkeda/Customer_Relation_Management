// ===================
// Sidebar Active Menu Highlight
// ===================
const currentPage = window.location.pathname.split("/").pop().toLowerCase();
const navLinks = document.querySelectorAll(".nav-list .nav-link");
navLinks.forEach(link => {
    const linkPage = link.getAttribute("href").toLowerCase();
    link.classList.toggle("active", linkPage === currentPage);
});

document.addEventListener("DOMContentLoaded", async () => {
    const form = document.querySelector("form");
    const editProjectId = localStorage.getItem("editProjectId");

    const personInput = document.getElementById("PersonName"); 
    const datalist = document.getElementById("personList");
    const contactInput = document.getElementById("Contact");
    const emailInput = document.getElementById("Email");

    let personsData = [];

    // ===================
    // Fetch quotations (person names)
    // ===================
    try {
        const res = await fetch("http://127.0.0.1:8000/api/quotations/");
        if (!res.ok) throw new Error("Failed to fetch quotations");
        personsData = await res.json();

        personsData.forEach(q => {
            const option = document.createElement("option");
            option.value = q.person_name;
            datalist.appendChild(option);
        });
    } catch (err) {
        console.error(err);
    }

    // ===================
    // Auto-fill contact & email when typing/selecting
    // ===================
    personInput.addEventListener("input", () => {
        const name = personInput.value.trim();
        const match = personsData.find(p => p.person_name.toLowerCase() === name.toLowerCase());
        if (match) {
            contactInput.value = match.contact || "";
            emailInput.value = match.email || "";
        } else {
            contactInput.value = "";
            emailInput.value = "";
        }
    });

    // ===================
    // Edit Project
    // ===================
    if (editProjectId) {
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/projects/${editProjectId}/`);
            if (!res.ok) throw new Error("Failed to fetch project");
            const project = await res.json();

            document.getElementById("ProjectName").value = project.project_name || "";
            document.getElementById("description").value = project.description || "";
            document.getElementById("ServerName").value = project.server_name || "";
            contactInput.value = project.contact_number || "";
            emailInput.value = project.email || "";
            personInput.value = project.person_name || "";
            document.getElementById("projectstatus").value = project.status || "";

            document.querySelector("h1.dashboard").innerText = "Edit Project";
            document.querySelector(".custom-btn1").innerText = "Update";

            form.addEventListener("submit", async (e) => {
                e.preventDefault();
                const data = getFormData();
                try {
                    const response = await fetch(`http://127.0.0.1:8000/api/projects/${editProjectId}/`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(data)
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
        // ===================
        // Add New Project
        // ===================
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const data = getFormData();
            try {
                const response = await fetch("http://127.0.0.1:8000/api/projects/", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data)
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
            server_name: document.getElementById("ServerName").value,
            contact_number: contactInput.value,
            email: emailInput.value,
            person_name: personInput.value,
            status: document.getElementById("projectstatus").value
        };
    }
});
