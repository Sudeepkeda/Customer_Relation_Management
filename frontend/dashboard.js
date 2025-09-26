// ===================
// Dashboard.js
// ===================

// Highlight active link
document.addEventListener("DOMContentLoaded", () => {
  const currentPage = window.location.pathname.split("/").pop().toLowerCase();
  const navLinks = document.querySelectorAll(".nav-list .nav-link");

  navLinks.forEach(link => {
    const linkPage = link.getAttribute("href").toLowerCase();
    link.classList.toggle("active", linkPage === currentPage);
  });

  // Sidebar toggle
  const sidebar = document.getElementById("sidebar");
  const toggleBtn = document.getElementById("sidebarToggle");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      sidebar.classList.toggle("active");
    });
  }

  // Load dashboard data
  loadDashboardData();
});

async function loadDashboardData() {
  try {
    // Fetch Clients
    const clientsRes = await fetch("http://127.0.0.1:8000/api/clients/");
    const clients = await clientsRes.json();

    // Fetch Projects
    const projectsRes = await fetch("http://127.0.0.1:8000/api/projects/");
    const projects = await projectsRes.json();

    const today = new Date();

    // Helper: check if expiry is within N days
    function isExpiringSoon(dateStr, days) {
      if (!dateStr) return false;
      const expiryDate = new Date(dateStr);
      const diffTime = expiryDate - today;
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      return diffDays > 0 && diffDays <= days;
    }

    // Calculate Expiry Counts
    let expiry60 = 0, expiry30 = 0;
    clients.forEach(c => {
      if (
        isExpiringSoon(c.domain_end_date, 60) ||
        isExpiringSoon(c.server_end_date, 60) ||
        isExpiringSoon(c.maintenance_end_date, 60)
      ) expiry60++;

      if (
        isExpiringSoon(c.domain_end_date, 30) ||
        isExpiringSoon(c.server_end_date, 30) ||
        isExpiringSoon(c.maintenance_end_date, 30)
      ) expiry30++;
    });

    // Clients count
    const totalClients = clients.length;

    // Projects count
    const totalProjects = projects.length;
    const currentProjects = projects.filter(p => p.status?.toLowerCase() === "in progress").length;

    // Update UI
    document.getElementById("expiry60").textContent = expiry60;
    document.getElementById("expiry30").textContent = expiry30;
    document.getElementById("totalClients").textContent = totalClients;
    document.getElementById("currentProjects").textContent = currentProjects;
    document.getElementById("totalProjects").textContent = totalProjects;

  } catch (err) {
    console.error("Error loading dashboard data:", err);
  }
}
