// ===================
// Dashboard.js
// ===================
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
});

async function loadDashboardData() {
  try {
    const clientsRes = await fetch("http://127.0.0.1:8000/api/clients/");
    const clients = await clientsRes.json();

    const projectsRes = await fetch("http://127.0.0.1:8000/api/projects/");
    const projects = await projectsRes.json();

    const today = new Date();

    function daysUntil(dateStr) {
      if (!dateStr) return null;
      const date = new Date(dateStr);
      return Math.ceil((date - today) / (1000 * 60 * 60 * 24));
    }

    let expiry60 = 0, expiry30 = 0;

    clients.forEach(c => {
      const services = [
        daysUntil(c.domain_end_date),
        daysUntil(c.server_end_date),
        daysUntil(c.maintenance_end_date)
      ].filter(d => d !== null); // remove nulls

      if (services.some(d => d <= 60)) expiry60++;  // includes expired (d <= 0)
      if (services.some(d => d <= 30)) expiry30++;  // includes expired (d <= 0)
    });

    document.getElementById("expiry60").textContent = expiry60;
    document.getElementById("expiry30").textContent = expiry30;
    document.getElementById("totalClients").textContent = clients.length;
    document.getElementById("totalProjects").textContent = projects.length;
    document.getElementById("currentProjects").textContent = projects.filter(p => p.status?.toLowerCase() === "in progress").length;

  } catch (err) {
    console.error("Error loading dashboard data:", err);
  }
}
