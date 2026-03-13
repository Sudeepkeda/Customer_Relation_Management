document.getElementById("loginBtn").addEventListener("click", async function () {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) {
    alert("Please enter both username and password.");
    return;
  }

  try {
    const response = await fetch("https://crm.design-bharat.com/api/login/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

   if (response.ok && data.token)
 {
      // ✅ Save token securely
      localStorage.setItem("authToken", data.token);

      // ✅ Optional: store username for display in dashboard/profile
      localStorage.setItem("username", username);

      alert("Login successful!");

      // ✅ Redirect to dashboard (always without .html)
      window.location.href = "/dashboard/";
    } else {
      alert(data.message || "Login failed. Please check your credentials.");
    }
  } catch (error) {
    console.error("Error during login:", error);
    alert("Server error. Please try again later.");
  }
});
