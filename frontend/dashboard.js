// ===================
// Dashboard.js
// ===================
let allClients = [];
let allEnquiries = [];
let allUpdations = [];

document.addEventListener("DOMContentLoaded", () => {
  const currentPage = window.location.pathname.split("/").pop().toLowerCase();

  // Sidebar Active Highlight
  document.querySelectorAll(".nav-list .nav-link").forEach(link => {
    const linkPage = link.getAttribute("href").toLowerCase();
    link.classList.toggle("active", linkPage === currentPage);
  });

  // Sidebar Toggle
  const sidebar = document.getElementById("sidebar");
  const toggleBtn = document.getElementById("sidebarToggle");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => sidebar.classList.toggle("active"));
  }

  // Load Dashboard Data
  loadDashboardData();

  // Expiry card click
  document.getElementById("expiry30").parentElement.addEventListener("click", () => showExpiryClients(30));
  document.getElementById("expiry60").parentElement.addEventListener("click", () => showExpiryClients(60));

  // Navigation from cards
  document.getElementById("totalClients").addEventListener("click", () => {
    window.location.href = "Clients.html";
  });

  document.getElementById("currentProjects").addEventListener("click", () => {
    window.location.href = "Projects.html?filter=inprogress";
  });

  document.getElementById("totalProjects").addEventListener("click", () => {
    window.location.href = "Projects.html?filter=all";
  });

  // 🔹 Enquiry & Updation cards navigation
  document.getElementById("Enquiry").addEventListener("click", () => {
    window.location.href = "enquiry.html?filter=notstarted";
  });

  document.getElementById("Updatation").addEventListener("click", () => {
    window.location.href = "updation.html?filter=notstarted";
  });

  // Profile Logo redirect
  const profileLogo = document.querySelector(".dashboard-head img");
  if (profileLogo) {
    profileLogo.addEventListener("click", () => {
      window.location.href = "profile.html";
    });
  }
});

// ===================
// Helper Functions
// ===================
function normalizeDate(dateStr) {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysFromStart(startDateStr, endDateStr) {
  if (!startDateStr || !endDateStr) return null;
  const start = normalizeDate(startDateStr);
  const end = normalizeDate(endDateStr);
  const diffMs = end - start;
  return Math.max(Math.ceil(diffMs / (1000 * 60 * 60 * 24)), 0);
}

// ===================
// Load Dashboard Data
// ===================
async function loadDashboardData() {
  try {
    // Fetch clients
    const clientsRes = await fetch("http://127.0.0.1:8000/api/clients/");
    allClients = await clientsRes.json();

    // Fetch projects
    const projectsRes = await fetch("http://127.0.0.1:8000/api/projects/");
    const projects = await projectsRes.json();

    // Fetch enquiries
    const enquiryRes = await fetch("http://127.0.0.1:8000/api/enquiries/");
    allEnquiries = await enquiryRes.json();

    // Fetch updations
    const updationRes = await fetch("http://127.0.0.1:8000/api/updations/");
    allUpdations = await updationRes.json();

    // ===================
    // Expiry Calculation
    // ===================
    let expiry30 = 0, expiry60 = 0;
    allClients.forEach(c => {
      const services = [
        { type: "Domain", days: daysFromStart(c.domain_start_date, c.domain_end_date) },
        { type: "Server", days: daysFromStart(c.server_start_date, c.server_end_date) },
        { type: "Maintenance", days: daysFromStart(c.maintenance_start_date, c.maintenance_end_date) }
      ].filter(s => s.days !== null);

      services.forEach(s => {
        if (s.days <= 30) expiry30++;
        else if (s.days <= 60) expiry60++;
      });
    });

    // ===================
    // Enquiry & Updation Stats
    // ===================
    const notStartedEnquiries = allEnquiries.filter(e => e.status?.toLowerCase() === "notstarted").length;
    const notStartedUpdations = allUpdations.filter(u => u.status?.toLowerCase() === "notstarted").length;

    // ===================
    // Update Dashboard UI
    // ===================
    document.getElementById("expiry30").textContent = expiry30;
    document.getElementById("expiry60").textContent = expiry60;
    document.getElementById("totalClients").textContent = allClients.length;
    document.getElementById("totalProjects").textContent = projects.length;
    document.getElementById("currentProjects").textContent =
      projects.filter(p => p.status?.toLowerCase() === "in progress").length;
    document.getElementById("Enquiry").textContent = notStartedEnquiries;
    document.getElementById("Updatation").textContent = notStartedUpdations;

  } catch (err) {
    console.error("Error loading dashboard data:", err);
  }
}

// ===================
// Show Expiry Clients in Modal
// ===================
function showExpiryClients(limit) {
  const expiring = allClients.flatMap(c => {
    return [
      { client: c.person_name, service: "Domain", days: daysFromStart(c.domain_start_date, c.domain_end_date) },
      { client: c.person_name, service: "Server", days: daysFromStart(c.server_start_date, c.server_end_date) },
      { client: c.person_name, service: "Maintenance", days: daysFromStart(c.maintenance_start_date, c.maintenance_end_date) }
    ].filter(s => {
      if (limit === 30) {
        return s.days !== null && s.days <= 30;
      } else if (limit === 60) {
        return s.days !== null && s.days > 30 && s.days <= 60;
      }
    });
  });

  const tbody = document.getElementById("expiryList");
  tbody.innerHTML = expiring.map(e => {
    let displayDays = e.days <= 0 ? "Expired" : `${e.days} days`;
    return `<tr><td>${e.client}</td><td>${e.service}</td><td>${displayDays}</td></tr>`;
  }).join("");

  document.getElementById("expiryModalTitle").textContent = `Clients Expiring in ≤${limit} Days`;
  new bootstrap.Modal(document.getElementById("expiryModal")).show();
}
