document.addEventListener("DOMContentLoaded", async () => {
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const saveBtn = document.getElementById("saveProfileBtn");

  // ✅ Get the token from localStorage
  const token = localStorage.getItem("authToken");
  if (!token) {
    alert("You are not logged in. Please login first.");
    window.location.href = "login.html";
    return;
  }

  // ----------------------------
  // 1️⃣ Fetch current user info
  // ----------------------------
  try {
    const res = await fetch("http://127.0.0.1:8000/api/user-profile/", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Token ${token}`
      }
    });

    if (res.ok) {
      const data = await res.json();
      usernameInput.value = data.username || "";
    } else if (res.status === 401) {
      alert("Token expired or invalid. Please login again.");
      localStorage.removeItem("authToken");
      window.location.href = "login.html";
    } else {
      console.error("Failed to fetch profile:", res.status);
    }
  } catch (err) {
    console.error("Error fetching profile:", err);
  }

  // ----------------------------
  // 2️⃣ Save updated profile
  // ----------------------------
  saveBtn.addEventListener("click", async () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username && !password) {
      alert("Please enter a new username or password.");
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/api/user-profile/", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${token}`
        },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message || "Profile updated successfully!");
        passwordInput.value = ""; // clear password field
      } else {
        alert(data.error || data.message || "Failed to update profile.");
        if (res.status === 401) {
          localStorage.removeItem("authToken");
          window.location.href = "login.html";
        }
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("An error occurred. Try again.");
    }
  });
});
