// ===============================
// PROFILE PAGE 
// ===============================
(function () {

const BASE_URL = window.location.origin;

document.addEventListener("DOMContentLoaded", async () => {

  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const saveBtn = document.getElementById("saveProfileBtn");
  const cancelBtn = document.getElementById("cancelProfileBtn");

  const token = localStorage.getItem("authToken");

  // -------------------------------------
  // AUTH CHECK
  // -------------------------------------
  if (!token) {
    //alert("You are not logged in. Please login first.");
    window.location.href = "/";
    return;
  }

  // -------------------------------------
  // LOAD CURRENT PROFILE
  // -------------------------------------
  try {
      const res = await fetch(`${BASE_URL}/api/user-profile/`, {
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
      alert("Session expired. Please log in again.");
      localStorage.removeItem("authToken");
      window.location.href = "/";
      return;
    }
  } catch (err) {
    console.error("Error fetching profile:", err);
   // alert("Failed to fetch profile data.");
  }

  // -------------------------------------
  // SAVE PROFILE
  // -------------------------------------
  saveBtn.addEventListener("click", async () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username && !password) {
      alert("Please enter a new username or password.");
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/api/user-profile/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${token}`
        },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        //alert(data.message || "Profile updated successfully!");

        // Reset password field
        passwordInput.value = "";

        // Redirect to dashboard
        window.location.href = "/dashboard";
      } else {
        alert(data.error || data.message || "Failed to update profile.");

        if (res.status === 401) {
          localStorage.removeItem("authToken");
          window.location.href = "/";
        }
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("An error occurred. Try again.");
    }
  });

  // -------------------------------------
  // CANCEL BUTTON
  // -------------------------------------
  cancelBtn.addEventListener("click", () => {
    window.location.href = "/dashboard";
  });

}); // DOMContentLoaded end

})(); // IIFE end
