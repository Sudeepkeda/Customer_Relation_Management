// ===================
// dashboard.js 
// ===================
(function () {
  "use strict";

  const BASE_URL = window.location.origin;

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

  /** Whole calendar days from today until end date (negative = already expired). */
  function DB_daysUntilEnd(endDateStr) {
    if (!endDateStr) return null;
    const end = new Date(endDateStr);
    const today = new Date();
    end.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return Math.ceil((end - today) / (1000 * 60 * 60 * 24));
  }

  function DB_expiryRangeTitle(limit) {
    if (limit === 5) return "Expiry (5 Days)";
    if (limit === 15) return "Expiry (15 Days)";
    if (limit === 30) return "Expiry (30 Days)";
    if (limit === 60) return "Expiry (60 Days)";
    return `Expiry (${limit} Days)`;
  }

  function DB_rowMatchesExpiryBand(daysLeft, limit) {
    if (daysLeft === null || !Number.isFinite(daysLeft)) return false;
    if (limit === 5) return daysLeft <= 5;
    if (limit === 15) return daysLeft >= 6 && daysLeft <= 15;
    if (limit === 30) return daysLeft >= 16 && daysLeft <= 30;
    if (limit === 60) return daysLeft >= 31 && daysLeft <= 60;
    return false;
  }

  // Show expiry clients modal (days remaining until end date; same bands as Expiry page)
  function showExpiryClients(limit) {
    const title = DB_expiryRangeTitle(limit);
    if (!Array.isArray(DB_allClients) || DB_allClients.length === 0) {
      const tbody = el("expiryList");
      if (tbody) tbody.innerHTML = `<tr><td colspan="3" class="text-center">No data available</td></tr>`;
      if (el("expiryModalTitle")) el("expiryModalTitle").textContent = title;
      new bootstrap.Modal(el("expiryModal")).show();
      return;
    }

    const rows = DB_allClients.flatMap((c) => {
      const list = [
        { client: c.person_name || c.company_name || "-", service: "Domain", days: DB_daysUntilEnd(c.domain_end_date) },
        { client: c.person_name || c.company_name || "-", service: "Server", days: DB_daysUntilEnd(c.server_end_date) },
        { client: c.person_name || c.company_name || "-", service: "Maintenance", days: DB_daysUntilEnd(c.maintenance_end_date) },
      ];
      return list
        .filter((s) => s.days !== null && Number.isFinite(s.days))
        .filter((s) => DB_rowMatchesExpiryBand(s.days, limit));
    });

    const tbody = el("expiryList");
    if (tbody) {
      if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="3" class="text-center">No clients found for the selected range.</td></tr>`;
      } else {
        tbody.innerHTML = rows.map((r) => {
          const displayDays = r.days <= 0 ? "Expired" : `${r.days} days`;
          return `<tr><td>${r.client}</td><td>${r.service}</td><td>${displayDays}</td></tr>`;
        }).join("");
      }
    }

    if (el("expiryModalTitle")) el("expiryModalTitle").textContent = title;
    const modalEl = el("expiryModal");
    if (modalEl) new bootstrap.Modal(modalEl).show();
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
        fetch(`${BASE_URL}/api/clients/`, { headers }),
        fetch(`${BASE_URL}/api/projects/`, { headers }),
        fetch(`${BASE_URL}/api/enquiries/`, { headers }),
        fetch(`${BASE_URL}/api/updations/`, { headers })
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

      // Count SERVICES (each Domain / Server / Maintenance end separately).
      // Bands: Expiry (5 Days)=expired + ≤5d; (15)=6–15; (30)=16–30; (60)=31–60. >60 not counted.
      let expiry5 = 0;
      let expiry15 = 0;
      let expiry30 = 0;
      let expiry60 = 0;

      DB_allClients.forEach((c) => {
        const ends = [c.domain_end_date, c.server_end_date, c.maintenance_end_date];
        ends.forEach((endStr) => {
          const d = DB_daysUntilEnd(endStr);
          if (d === null || !Number.isFinite(d)) return;
          if (d <= 5) expiry5++;
          else if (d >= 6 && d <= 15) expiry15++;
          else if (d >= 16 && d <= 30) expiry30++;
          else if (d >= 31 && d <= 60) expiry60++;
        });
      });

      // Enquiry & Updation stats
      const notStartedEnquiries = (DB_allEnquiries || []).filter(e => {
        const s = (e.status || "").toLowerCase();
        return s === "notyet" || s === "notstarted";
      }).length;
      const updationsCompleted = (DB_allUpdations || []).filter(u => (u.status || "").toLowerCase() === "completed").length;
      const updationsNew = (DB_allUpdations || []).filter(u => (u.status || "").toLowerCase() === "new").length;
      const updationsInprogress = (DB_allUpdations || []).filter(u => {
        const s = (u.status || "").toLowerCase();
        return s === "inprogress" || s === "in-progress" || s === "in progress";
      }).length;
      const updationsOnhold = (DB_allUpdations || []).filter(u => (u.status || "").toLowerCase() === "notstarted").length;

      // Update UI safely (check elements exist)
      if (el("expiry5")) el("expiry5").textContent = expiry5;
      if (el("expiry15")) el("expiry15").textContent = expiry15;
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
      // Dashboard cards for Updations by status
      // - Updatation card shows Completed (as requested)
      if (el("Updatation")) el("Updatation").textContent = updationsCompleted;
      if (el("newupdation")) el("newupdation").textContent = updationsNew;
      if (el("inprogress")) el("inprogress").textContent = updationsInprogress;
      if (el("onhold")) el("onhold").textContent = updationsOnhold;

    } catch (err) {
      console.error("Error loading dashboard data:", err);
      // Do not crash UI — show zeros if elements present
      if (el("expiry5")) el("expiry5").textContent = "0";
      if (el("expiry15")) el("expiry15").textContent = "0";
      if (el("expiry30")) el("expiry30").textContent = "0";
      if (el("expiry60")) el("expiry60").textContent = "0";
      if (el("Updatation")) el("Updatation").textContent = "0";
      if (el("newupdation")) el("newupdation").textContent = "0";
      if (el("inprogress")) el("inprogress").textContent = "0";
      if (el("onhold")) el("onhold").textContent = "0";
    }
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

    // Expiry cards: open Expiry page with pre-filter
    const expiry5Card = el("expiry5")?.parentElement;
    if (expiry5Card) expiry5Card.addEventListener("click", () => window.location.href = "/expiry/?days=5");

    const expiry15Card = el("expiry15")?.parentElement;
    if (expiry15Card) expiry15Card.addEventListener("click", () => window.location.href = "/expiry/?days=15");

    const expiry30Card = el("expiry30")?.parentElement;
    if (expiry30Card) expiry30Card.addEventListener("click", () => window.location.href = "/expiry/?days=30");

    const expiry60Card = el("expiry60")?.parentElement;
    if (expiry60Card) expiry60Card.addEventListener("click", () => window.location.href = "/expiry/?days=60");
    
    // Cards navigation (if elements exist)
    el("totalClients")?.parentElement?.addEventListener("click", () => window.location.href = "/clients/");
    el("currentProjects")?.parentElement?.addEventListener("click", () => window.location.href = "/projects/?filter=active");
    el("totalProjects")?.parentElement?.addEventListener("click", () => window.location.href = "/projects/?filter=all");
    // Enquiry card: click anywhere on the card (not just the number)
    el("Enquiry")?.parentElement?.addEventListener("click", () => window.location.href = "/enquiry/?filter=notyet");
    // Updation cards (click anywhere on the card via parentElement)
    el("Updatation")?.parentElement?.addEventListener("click", () => window.location.href = "/updation/?filter=Completed");
    el("newupdation")?.parentElement?.addEventListener("click", () => window.location.href = "/updation/?filter=New");
    el("inprogress")?.parentElement?.addEventListener("click", () => window.location.href = "/updation/?filter=Inprogress");
    el("onhold")?.parentElement?.addEventListener("click", () => window.location.href = "/updation/?filter=Notstarted");

    // Profile logo
    const profileLogo = document.querySelector(".dashboard-head img");
    if (profileLogo) profileLogo.addEventListener("click", () => window.location.href = "/user-profile/");

    // Finally load dashboard data
    loadDashboardData();
  });

  // Expose showExpiryClients to global so templates that call it directly still work
  window.showExpiryClients = showExpiryClients;

})();
