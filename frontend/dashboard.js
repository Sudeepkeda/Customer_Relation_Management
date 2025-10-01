// ===================
// Dashboard.js
// ===================
let allClients = []; // store globally for listing

document.addEventListener("DOMContentLoaded", () => {
  const currentPage = window.location.pathname.split("/").pop().toLowerCase();
  document.querySelectorAll(".nav-list .nav-link").forEach(link => {
    const linkPage = link.getAttribute("href").toLowerCase();
    link.classList.toggle("active", linkPage === currentPage);
  });

  // Sidebar toggle
  const sidebar = document.getElementById("sidebar");
  const toggleBtn = document.getElementById("sidebarToggle");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => sidebar.classList.toggle("active"));
  }

  loadDashboardData();

  // Click events for expiry cards
  document.getElementById("expiry30").parentElement.addEventListener("click", () => showExpiryClients(30));
  document.getElementById("expiry60").parentElement.addEventListener("click", () => showExpiryClients(60));

  // 🔹 Added navigation for dashboard cards
  document.getElementById("totalClients").addEventListener("click", () => {
    window.location.href = "Clients.html";
  });

  document.getElementById("currentProjects").addEventListener("click", () => {
    window.location.href = "Projects.html?filter=inprogress";
  });

  document.getElementById("totalProjects").addEventListener("click", () => {
    window.location.href = "Projects.html?filter=all";
  });
});


async function loadDashboardData() {
  try {
    const clientsRes = await fetch("http://127.0.0.1:8000/api/clients/");
    allClients = await clientsRes.json(); // store clients globally

    const projectsRes = await fetch("http://127.0.0.1:8000/api/projects/");
    const projects = await projectsRes.json();

    const today = new Date();

    function daysUntil(dateStr) {
      if (!dateStr) return null;
      const date = new Date(dateStr);
      return Math.ceil((date - today) / (1000 * 60 * 60 * 24));
    }

    let expiry30 = 0, expiry60 = 0;

    allClients.forEach(c => {
      const services = [
        { type: "Domain", days: daysUntil(c.domain_end_date) },
        { type: "Server", days: daysUntil(c.server_end_date) },
        { type: "Maintenance", days: daysUntil(c.maintenance_end_date) }
      ].filter(s => s.days !== null);

      services.forEach(s => {
        if (s.days <= 30) {
          expiry30++; // expired also included
        } else if (s.days <= 60) {
          expiry60++;
        }
      });
    });

    document.getElementById("expiry30").textContent = expiry30;
    document.getElementById("expiry60").textContent = expiry60;
    document.getElementById("totalClients").textContent = allClients.length;
    document.getElementById("totalProjects").textContent = projects.length;
    document.getElementById("currentProjects").textContent =
      projects.filter(p => p.status?.toLowerCase() === "in progress").length;

  } catch (err) {
    console.error("Error loading dashboard data:", err);
  }
}

// ===================
// Show Expiry Clients in Modal
// ===================
function showExpiryClients(limit) {
  const today = new Date();

  function daysUntil(dateStr) {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return Math.ceil((date - today) / (1000 * 60 * 60 * 24));
  }

  const expiring = allClients.flatMap(c => {
    return [
      { client: c.person_name, service: "Domain", days: daysUntil(c.domain_end_date) },
      { client: c.person_name, service: "Server", days: daysUntil(c.server_end_date) },
      { client: c.person_name, service: "Maintenance", days: daysUntil(c.maintenance_end_date) }
    ].filter(s => {
      if (limit === 30) {
        return s.days !== null && s.days <= 30; // include expired
      } else if (limit === 60) {
        return s.days !== null && s.days > 30 && s.days <= 60; // exclude expired
      }
    });
  });

  const tbody = document.getElementById("expiryList");
  tbody.innerHTML = expiring.map(e => {
    let displayDays = e.days <= 0 ? "Expired" : e.days;
    return `<tr><td>${e.client}</td><td>${e.service}</td><td>${displayDays}</td></tr>`;
  }).join("");

  document.getElementById("expiryModalTitle").textContent = `Clients Expiring in ≤${limit} Days`;
  new bootstrap.Modal(document.getElementById("expiryModal")).show();
}
