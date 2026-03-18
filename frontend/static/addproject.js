// ================================
// Add / Edit Project  
// ================================
document.addEventListener("DOMContentLoaded", async () => {

  const form = document.getElementById("projectForm");
  const personDropdown = document.getElementById("PersonName");
  const contactInput = document.getElementById("Contact");
  const emailInput = document.getElementById("Email");
  const descriptionTextarea = document.getElementById("description");

  const token = localStorage.getItem("authToken");

  let personsData = [];
  let descriptionEditor = null;

  // Redirect if not authenticated
  if (!token) {
    //alert("Session expired. Please log in again.");
    window.location.href = "/";
    return;
  }

  // -----------------------------
  // CKEditor for Project Description
  // -----------------------------
  if (window.CKEDITOR && descriptionTextarea) {
    descriptionEditor = CKEDITOR.replace("description", {
      height: 350,
      extraPlugins: "uploadimage,colorbutton,font,justify,tableresize,tableselection",
      removePlugins: "image2,exportpdf",
      filebrowserUploadUrl: "/api/ckeditor-upload/",
      filebrowserUploadMethod: "form",
      uploadUrl: "/api/ckeditor-upload/",
      allowedContent: true,
      removeDialogTabs: "image:advanced;image:Link",
    });
  }

  // -----------------------------
  // Cancel Button
  // -----------------------------
  const cancelBtn = document.getElementById("cancelBtn");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      window.location.href = "/projects";
    });
  }

  // -----------------------------
  // Profile Redirect
  // -----------------------------
  const profileLogo = document.querySelector(".dashboard-head img");
  if (profileLogo) {
    profileLogo.addEventListener("click", () => {
      window.location.href = "/user-profile/";
    });
  }

  // -----------------------------
  // Sidebar Active Highlight
  // -----------------------------
  const currentPath = window.location.pathname.toLowerCase().replace(/\/$/, "");
  const normalizedCurrent = currentPath.replace(/\.html$/, "");

  document.querySelectorAll(".nav-list .nav-link").forEach((link) => {
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

  // -----------------------------
  // Sidebar Toggle
  // -----------------------------
  const sidebar = document.getElementById("sidebar");
  const toggleBtn = document.getElementById("sidebarToggle");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      sidebar.classList.toggle("active");
    });
  }

  // ==============================
  // Load Persons From Quotations
  // ==============================
  async function loadPersons(selectedPerson = null) {
    try {
      const res = await fetch("https://crm.design-bharat.com/api/quotations/", { //https://crm.design-bharat.com
        headers: {
          "Authorization": token.startsWith("Token") ? token : "Token " + token,
          "Content-Type": "application/json",
        },
      });

      const quotations = await res.json();

      // Build unique persons by name 
    const uniquePersonsMap = new Map();
    quotations.forEach((q) => {
      const name = (q.person_name || "").trim();
      if (!name) return; 
      if (!uniquePersonsMap.has(name)) {
        uniquePersonsMap.set(name, {
          person_name: name,
          contact: q.contact || "",
          email: q.email || "",
        });
      }
    });
    const uniquePersons = Array.from(uniquePersonsMap.values());
    personDropdown.innerHTML = '<option value="">-- Select Person --</option>';
    uniquePersons.forEach((p) => {
      const option = document.createElement("option");
      option.value = p.person_name;
      option.text = p.person_name;
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
    //alert("Failed to load persons list.");
  }
}

  function handlePersonChange() {
    const selected = personDropdown.options[personDropdown.selectedIndex];
    contactInput.value = selected.dataset.contact || "";
    emailInput.value = selected.dataset.email || "";
  }

  personDropdown.addEventListener("change", handlePersonChange);

  // ==============================
  // Load Project for Editing (sessionStorage)
  // ==============================
  const editProject = JSON.parse(sessionStorage.getItem("editProject") || "null");

  if (editProject) {
    document.getElementById("ProjectName").value = editProject.project_name || "";
    if (descriptionEditor) {
      descriptionEditor.setData(editProject.description || "");
    } else {
      document.getElementById("description").value = editProject.description || "";
    }
    document.getElementById("ServerName").value = editProject.server_name || "";
    document.getElementById("projectstatus").value = editProject.status || "";

    await loadPersons(editProject.person_name);

    // UI update
    document.querySelector("h1.dashboard").innerText = "Edit Project";
    document.querySelector(".custom-btn1").innerText = "Update";

    sessionStorage.removeItem("editProject");

  } else {
    await loadPersons();
  }

  // ==============================
  // Form Submission
  // ==============================
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
      project_name: document.getElementById("ProjectName").value,
      description: descriptionEditor ? descriptionEditor.getData() : document.getElementById("description").value,
      server_name: document.getElementById("ServerName").value,
      contact_number: contactInput.value,
      email: emailInput.value,
      person_name: personDropdown.value,
      status: document.getElementById("projectstatus").value,
    };

    try {
      const url = editProject
        ? `https://crm.design-bharat.com/api/projects/${editProject.id}/`
        : "https://crm.design-bharat.com/api/projects/";

      const method = editProject ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": token.startsWith("Token") ? token : "Token " + token,
        },
        body: JSON.stringify(data),
      });

      if (res.ok) {
       // alert(editProject ? "Project updated successfully!" : "Project saved successfully!");
        window.location.href = "/projects";
      } else {
        const errText = await res.text();
        console.error("API Error:", errText);
        //alert("Error saving project: " + errText);
      }
    } catch (err) {
      console.error(err);
      //alert("Server error. Please try again later.");
    }
  });

});
