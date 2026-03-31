// ===================
// Create/Edit Todo
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

  const token = localStorage.getItem("authToken");
  if (!token) return;

  const form = document.getElementById("todoForm");
  const cancelBtn = document.getElementById("cancelBtn");
  const statusEl = document.getElementById("status");
  const postponeWrap = document.getElementById("postponeWrap");
  const postponeToEl = document.getElementById("postponeTo");

  const editId = localStorage.getItem("editTodoId");

  function togglePostpone() {
    const isPostponed = statusEl.value === "Postponed";
    postponeWrap.classList.toggle("d-none", !isPostponed);
    if (!isPostponed) postponeToEl.value = "";
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

  async function loadForEdit(id) {
    const t = await apiFetch(`/api/todos/${id}/`);
    document.getElementById("title").value = t.title || "";
    document.getElementById("description").value = t.description || "";
    document.getElementById("taskDate").value = t.task_date || "";
    document.getElementById("startTime").value = t.start_time ? String(t.start_time).slice(0, 5) : "";
    document.getElementById("endTime").value = t.end_time ? String(t.end_time).slice(0, 5) : "";
    statusEl.value = t.status || "NotYet";
    togglePostpone();
    postponeToEl.value = t.postpone_to || "";
  }

  statusEl?.addEventListener("change", togglePostpone);
  togglePostpone();

  cancelBtn?.addEventListener("click", () => {
    localStorage.removeItem("editTodoId");
    window.location.href = "/todo/";
  });

  if (editId) {
    try {
      await loadForEdit(editId);
    } catch (e) {
      console.error(e);
      localStorage.removeItem("editTodoId");
    }
  }

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const payload = {
      title: document.getElementById("title").value.trim(),
      description: document.getElementById("description").value.trim() || null,
      task_date: document.getElementById("taskDate").value,
      start_time: document.getElementById("startTime").value || null,
      end_time: document.getElementById("endTime").value || null,
      status: statusEl.value,
      postpone_to: statusEl.value === "Postponed" ? (postponeToEl.value || null) : null,
    };

    try {
      if (editId) {
        await apiFetch(`/api/todos/${editId}/`, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await apiFetch("/api/todos/", { method: "POST", body: JSON.stringify(payload) });
      }
      localStorage.removeItem("editTodoId");
      window.location.href = "/todo/";
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to save todo");
    }
  });
});

