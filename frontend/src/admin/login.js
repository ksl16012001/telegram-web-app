document.getElementById("loginForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    const password = document.getElementById("password").value;

    const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
    });

    const data = await response.json();
    if (data.success) {
        localStorage.setItem("adminToken", data.token);
        window.location.href = "/admin";
    } else {
        alert("❌ " + data.message);
    }
});
