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

    const personDropdown = document.getElementById("PersonName");
    const contactInput = document.getElementById("Contact");
    const emailInput = document.getElementById("Email");

    let personsData = [];

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
                option.text = p.person_name; // ✅ This makes the text visible
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

    // ===================
    // Auto-fill contact & email when person selected
    // ===================
    function handlePersonChange() {
        const selected = personDropdown.options[personDropdown.selectedIndex];
        contactInput.value = selected.dataset.contact || "";
        emailInput.value = selected.dataset.email || "";
    }

    personDropdown.addEventListener("change", handlePersonChange);

    // ===================
    // Edit Project
    // ===================
    if (editProjectId) {
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/projects/${editProjectId}/`);
            const project = await res.json();

            document.getElementById("ProjectName").value = project.project_name || "";
            document.getElementById("description").value = project.description || "";
            document.getElementById("ServerName").value = project.server_name || "";
            document.getElementById("projectstatus").value = project.status || "";

            await loadPersons(project.person_name); // Pre-select person

            document.querySelector("h1.dashboard").innerText = "Edit Project";
            document.querySelector(".custom-btn1").innerText = "Update";
        } catch (err) {
            console.error(err);
            alert("Error loading project data.");
        }
    } else {
        await loadPersons();
    }

    // ===================
    // Form submission (Add / Edit)
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
            const url = editProjectId 
                ? `http://127.0.0.1:8000/api/projects/${editProjectId}/`
                : "http://127.0.0.1:8000/api/projects/";
            const method = editProjectId ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                alert(editProjectId ? "Project updated!" : "Project saved!");
                localStorage.removeItem("editProjectId");
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
