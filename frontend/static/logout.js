document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".logout a").forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      try {
        localStorage.removeItem("authToken");
      } catch (_) {}
      window.location.href = "/";
    });
  });
});
