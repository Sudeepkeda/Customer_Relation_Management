document.getElementById("loginBtn").addEventListener("click", async function () {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (username === "" || password === "") {
    alert(" Please enter both username and password.");
    return;
  }

  try{
    const response = await fetch("http://127.0.0.1:8000/api/login/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (response.ok) {
        alert("Login successful!");
        // Redirect to dashboard or another page
        window.location.href = "dashboard.html"; // here  dashboard URL
    } else {
        alert(data.error || "Login failed. Please try again.");
    }
    } catch (error) {
    console.error("Error during login:", error);
    alert("An error occurred. Please try again later.");
  }
});
