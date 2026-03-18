// ===================
// Todo - Calendar + Table + API Integration
// ===================
document.addEventListener("DOMContentLoaded", async () => {
  document.querySelectorAll(".nav-list .nav-link").forEach((link) => {
    const linkHref = (link.getAttribute("href") || "").toLowerCase();
    const currentPath = window.location.pathname.toLowerCase();
    if (currentPath === linkHref || currentPath.startsWith(linkHref + "/")) link.classList.add("active");
    else link.classList.remove("active");
  });

  const sidebar = document.getElementById("sidebar");
  const toggleBtn = document.getElementById("sidebarToggle");
  if (toggleBtn) toggleBtn.addEventListener("click", () => sidebar.classList.toggle("active"));

  const profileLogo = document.querySelector(".profile-logo");
  if (profileLogo) profileLogo.addEventListener("click", () => (window.location.href = "/user-profile"));

  const tableBody = document.querySelector(".table-data");
  const calendarGrid = document.getElementById("calendarGrid");
  const monthLabel = document.getElementById("monthLabel");
  const prevMonthBtn = document.getElementById("prevMonthBtn");
  const nextMonthBtn = document.getElementById("nextMonthBtn");

  const token = localStorage.getItem("authToken");
  if (!token) {
    tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Please login again.</td></tr>`;
    return;
  }

  let current = new Date();
  current.setDate(1);

  function fmtDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function monthStartEnd(d) {
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return { start, end };
  }

  async function apiFetch(url, opts = {}) {
    const res = await fetch(url, {
      ...opts,
      headers: {
        "Authorization": "Token " + token,
        "Content-Type": "application/json",
        ...(opts.headers || {}),
      },
    });
    if (!res.ok) {
      let msg = "Request failed";
      try {
        const data = await res.json();
        msg = data?.detail || data?.error || JSON.stringify(data);
      } catch (_) {}
      throw new Error(msg);
    }
    return res.status === 204 ? null : res.json();
  }

  function timeText(t) {
    if (!t) return "-";
    return String(t).slice(0, 5);
  }

  function statusBadge(s) {
    if (s === "Done") return `<span class="badge bg-success">Done</span>`;
    if (s === "Postponed") return `<span class="badge bg-warning text-dark">Postponed</span>`;
    return `<span class="badge bg-secondary">Not yet</span>`;
  }

  function renderCalendar(tasks, viewDate) {
    const { start, end } = monthStartEnd(viewDate);
    const firstDow = start.getDay(); // 0 Sun
    const totalDays = end.getDate();

    const byDate = new Map();
    tasks.forEach((t) => {
      const key = t.task_date;
      if (!byDate.has(key)) byDate.set(key, []);
      byDate.get(key).push(t);
    });

    monthLabel.textContent = viewDate.toLocaleString(undefined, { month: "long", year: "numeric" });

    const headers = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
      .map((h) => `<div class="cal-head">${h}</div>`)
      .join("");

    let cells = "";
    for (let i = 0; i < firstDow; i++) cells += `<div class="cal-cell muted"></div>`;

    for (let day = 1; day <= totalDays; day++) {
      const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
      const key = fmtDate(d);
      const list = byDate.get(key) || [];
      const dots = list.slice(0, 3).map(() => `<span class="dot"></span>`).join("");
      const more = list.length > 3 ? `<span class="more">+${list.length - 3}</span>` : "";

      const today = new Date();
      const isToday =
        today.getFullYear() === d.getFullYear() &&
        today.getMonth() === d.getMonth() &&
        today.getDate() === d.getDate();

      cells += `
        <div class="cal-cell ${isToday ? "today" : ""}" data-date="${key}">
          <div class="cal-day">${day}</div>
          <div class="cal-dots">${dots}${more}</div>
        </div>
      `;
    }

    calendarGrid.innerHTML = headers + cells;
    calendarGrid.querySelectorAll(".cal-cell[data-date]").forEach((cell) => {
      cell.addEventListener("click", () => {
        const date = cell.dataset.date;
        renderTable(tasks.filter((t) => t.task_date === date));
      });
    });
  }

  function renderTable(tasks) {
    tableBody.innerHTML = "";
    if (!tasks.length) {
      tableBody.innerHTML = `<tr><td colspan="6" class="text-center">No tasks</td></tr>`;
      return;
    }

    tasks
      .slice()
      .sort((a, b) => (a.task_date + (a.start_time || "")) > (b.task_date + (b.start_time || "")) ? 1 : -1)
      .forEach((t, idx) => {
        const time = t.start_time || t.end_time ? `${timeText(t.start_time)} - ${timeText(t.end_time)}` : "-";
        const row = `
          <tr>
            <td>${idx + 1}</td>
            <td>${t.task_date || "-"}</td>
            <td>${time}</td>
            <td>
              <div class="fw-semibold">${(t.title || "-").replaceAll("<", "&lt;")}</div>
              ${t.description ? `<div class="small text-muted">${String(t.description).replaceAll("<", "&lt;")}</div>` : ""}
              ${t.status === "Postponed" && t.postpone_to ? `<div class="small text-warning">Postpone to: ${t.postpone_to}</div>` : ""}
            </td>
            <td>${statusBadge(t.status)}</td>
            <td>
              <div class="d-flex flex-wrap gap-1">
                <button class="btn btn-sm btn-outline-primary edit-btn" data-id="${t.id}">Edit</button>
                <button class="btn btn-sm btn-outline-success done-btn" data-id="${t.id}">Done</button>
                <button class="btn btn-sm btn-outline-warning postpone-btn" data-id="${t.id}">Postpone</button>
                <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${t.id}">Delete</button>
              </div>
            </td>
          </tr>
        `;
        tableBody.insertAdjacentHTML("beforeend", row);
      });

    initRowActions();
  }

  function initRowActions() {
    document.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        localStorage.setItem("editTodoId", btn.dataset.id);
        window.location.href = "/todo/add/";
      });
    });

    document.querySelectorAll(".done-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        try {
          await apiFetch(`/api/todos/${btn.dataset.id}/`, {
            method: "PATCH",
            body: JSON.stringify({ status: "Done" }),
          });
          await loadMonth();
        } catch (e) {
          console.error(e);
        }
      });
    });

    document.querySelectorAll(".postpone-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const to = prompt("Postpone to date (YYYY-MM-DD):");
        if (!to) return;
        try {
          await apiFetch(`/api/todos/${btn.dataset.id}/`, {
            method: "PATCH",
            body: JSON.stringify({ status: "Postponed", postpone_to: to }),
          });
          await loadMonth();
        } catch (e) {
          console.error(e);
        }
      });
    });

    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        try {
          await apiFetch(`/api/todos/${btn.dataset.id}/`, { method: "DELETE" });
          await loadMonth();
        } catch (e) {
          console.error(e);
        }
      });
    });
  }

  async function loadMonth() {
    const { start, end } = monthStartEnd(current);
    // DRF doesn't have date filtering here; we pull and filter client-side for now.
    const all = await apiFetch("/api/todos/");
    const startKey = fmtDate(start);
    const endKey = fmtDate(end);
    const monthTasks = all.filter((t) => t.task_date >= startKey && t.task_date <= endKey);

    renderCalendar(monthTasks, current);
    renderTable(monthTasks);
  }

  prevMonthBtn?.addEventListener("click", async () => {
    current = new Date(current.getFullYear(), current.getMonth() - 1, 1);
    await loadMonth();
  });
  nextMonthBtn?.addEventListener("click", async () => {
    current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    await loadMonth();
  });

  await loadMonth();
});

