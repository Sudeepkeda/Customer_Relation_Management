// ===================
// dashboard.js 
// ===================
(function () {
  "use strict";

  // Local module state (isolated)
  let DB_allClients = [];
  let DB_allEnquiries = [];
  let DB_allUpdations = [];

  // Utility: get token header string
  function getAuthHeader() {
    const token = localStorage.getItem("authToken") || "";
    if (!token) return null;
    return token.startsWith("Token ") ? token : "Token " + token;
  }

  // Utility: normalize date (remove time)
  function DB_normalizeDate(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  // Utility: days between start and end (returns null if either missing)
  function DB_daysBetween(start, end) {
    if (!start || !end) return null;
    try {
      const s = DB_normalizeDate(start);
      const e = DB_normalizeDate(end);
      const diff = e - s;
      return Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 0);
    } catch {
      return null;
    }
  }

  // Safe DOM helper
  function el(id) {
    return document.getElementById(id);
  }

  // Load dashboard data (clients, projects, enquiries, updations)
  async function loadDashboardData() {
    const authHeader = getAuthHeader();
    if (!authHeader) {
      // token check done earlier, but double-check
      alert("You must log in first!");
      window.location.href = "/";
      return;
    }

    try {
      // Use Promise.all for parallel fetches (faster)
      const headers = { "Authorization": authHeader, "Content-Type": "application/json" };

      const [clientsRes, projectsRes, enquiriesRes, updationsRes] = await Promise.all([
        fetch("/api/clients/", { headers }),
        fetch("/api/projects/", { headers }),
        fetch("/api/enquiries/", { headers }),
        fetch("/api/updations/", { headers })
      ]);

      if (!clientsRes.ok) {
        console.warn("Clients fetch failed:", clientsRes.status);
        DB_allClients = [];
      } else {
        DB_allClients = await clientsRes.json() || [];
      }

      const projects = projectsRes.ok ? (await projectsRes.json() || []) : [];
      DB_allEnquiries = enquiriesRes.ok ? (await enquiriesRes.json() || []) : [];
      DB_allUpdations = updationsRes.ok ? (await updationsRes.json() || []) : [];

      // Calculate expiry counts
      let expiry30 = 0;
      let expiry60 = 0;

      DB_allClients.forEach(c => {
        const checks = [
          DB_daysBetween(c.domain_start_date, c.domain_end_date),
          DB_daysBetween(c.server_start_date, c.server_end_date),
          DB_daysBetween(c.maintenance_start_date, c.maintenance_end_date)
        ].filter(v => v !== null);

        checks.forEach(days => {
          if (days <= 30) expiry30++;
          else if (days <= 60) expiry60++;
        });
      });

      // Enquiry & Updation stats
      const notStartedEnquiries = (DB_allEnquiries || []).filter(e => (e.status || "").toLowerCase() === "notstarted").length;
      const notStartedUpdations = (DB_allUpdations || []).filter(u => (u.status || "").toLowerCase() === "notstarted").length;

      // Update UI safely (check elements exist)
      if (el("expiry30")) el("expiry30").textContent = expiry30;
      if (el("expiry60")) el("expiry60").textContent = expiry60;
      if (el("totalClients")) el("totalClients").textContent = DB_allClients.length;
      if (el("totalProjects")) el("totalProjects").textContent = projects.length;
      if (el("currentProjects")) {
          const activeCount = projects.filter(p => {
            const s = (p.status || "").toLowerCase();
            return s === "active";          // count Active status
          }).length;
          el("currentProjects").textContent = activeCount;
        }

      if (el("Enquiry")) el("Enquiry").textContent = notStartedEnquiries;
      if (el("Updatation")) el("Updatation").textContent = notStartedUpdations;

    } catch (err) {
      console.error("Error loading dashboard data:", err);
      // Do not crash UI — show zeros if elements present
      if (el("expiry30")) el("expiry30").textContent = "0";
      if (el("expiry60")) el("expiry60").textContent = "0";
    }
  }

  // Show expiry clients modal for limit days (30 or 60)
  function showExpiryClients(limit) {
    if (!Array.isArray(DB_allClients) || DB_allClients.length === 0) {
      // Nothing to show
      const tbody = el("expiryList");
      if (tbody) tbody.innerHTML = `<tr><td colspan="3" class="text-center">No data available</td></tr>`;
      if (el("expiryModalTitle")) el("expiryModalTitle").textContent = `Clients Expiring in ≤ ${limit} Days`;
      new bootstrap.Modal(el("expiryModal")).show();
      return;
    }

    const rows = DB_allClients.flatMap(c => {
      const list = [
        { client: c.person_name || c.company_name || "-", service: "Domain", days: DB_daysBetween(c.domain_start_date, c.domain_end_date) },
        { client: c.person_name || c.company_name || "-", service: "Server", days: DB_daysBetween(c.server_start_date, c.server_end_date) },
        { client: c.person_name || c.company_name || "-", service: "Maintenance", days: DB_daysBetween(c.maintenance_start_date, c.maintenance_end_date) }
      ];
      return list.filter(s => s.days !== null).filter(s => {
        if (limit === 30) return s.days <= 30;
        if (limit === 60) return s.days > 30 && s.days <= 60;
        return false;
      });
    });

    const tbody = el("expiryList");
    if (tbody) {
      if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="3" class="text-center">No clients found for the selected range.</td></tr>`;
      } else {
        tbody.innerHTML = rows.map(r => {
          const displayDays = (r.days <= 0) ? "Expired" : `${r.days} days`;
          return `<tr><td>${r.client}</td><td>${r.service}</td><td>${displayDays}</td></tr>`;
        }).join("");
      }
    }

    if (el("expiryModalTitle")) el("expiryModalTitle").textContent = `Clients Expiring in ≤ ${limit} Days`;
    const modalEl = el("expiryModal");
    if (modalEl) new bootstrap.Modal(modalEl).show();
  }

  // DOMContentLoaded -> initialize event listeners and load data
  document.addEventListener("DOMContentLoaded", () => {
    // Auth check
    const authHeader = getAuthHeader();
    if (!authHeader) {
      alert("You must log in first!");
      window.location.href = "/";
      return;
    }

    // Sidebar active highlight (defensive)
    document.querySelectorAll(".nav-list .nav-link").forEach(link => {
      try {
        const linkHref = (link.getAttribute("href") || "").toLowerCase();
        const currentPath = window.location.pathname.toLowerCase();
        if (currentPath === linkHref || currentPath.startsWith(linkHref + "/")) link.classList.add("active");
        else link.classList.remove("active");
      } catch (e) { /* ignore */ }
    });

    // Sidebar toggle
    const sidebarToggle = el("sidebarToggle");
    if (sidebarToggle) {
      sidebarToggle.addEventListener("click", () => {
        const s = el("sidebar");
        if (s) s.classList.toggle("active");
      });
    }

    // Expiry card clicks — guard for missing elements
    const expiry30Card = el("expiry30")?.parentElement;
    if (expiry30Card) expiry30Card.addEventListener("click", () => showExpiryClients(30));
    const expiry60Card = el("expiry60")?.parentElement;
    if (expiry60Card) expiry60Card.addEventListener("click", () => showExpiryClients(60));

    // Cards navigation (if elements exist)
    el("totalClients")?.addEventListener("click", () => window.location.href = "/clients/");
    el("currentProjects")?.addEventListener("click", () => window.location.href = "/projects/?filter=active");
    el("totalProjects")?.addEventListener("click", () => window.location.href = "/projects/?filter=all");
    el("Enquiry")?.addEventListener("click", () => window.location.href = "/enquiry/?filter=notstarted");
    el("Updatation")?.addEventListener("click", () => window.location.href = "/updation/?filter=notstarted");

    // Profile logo
    const profileLogo = document.querySelector(".dashboard-head img");
    if (profileLogo) profileLogo.addEventListener("click", () => window.location.href = "/user-profile/");

    // Finally load dashboard data
    loadDashboardData();
  });

  // Expose showExpiryClients to global so templates that call it directly still work
  window.showExpiryClients = showExpiryClients;

})();
