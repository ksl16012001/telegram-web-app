document.getElementById("loginForm").addEventListener("submit", async function (e) {
    e.preventDefault(); // Prevent form from submitting the traditional way

    const password = document.getElementById("password").value; // Get the password input value

    // Make a POST request to the /api/auth/login endpoint
    const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }) // Send the password in the request body
    });

    const data = await response.json();

    if (data.success) {
        // If login is successful, store the JWT token in localStorage
        localStorage.setItem("adminToken", data.token);

        // Redirect to the admin page
        window.location.href = "/admin";
    } else {
        // If login fails, alert the error message
        alert("❌ " + data.message);
    }
});
