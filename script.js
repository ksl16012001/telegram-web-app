document.addEventListener("DOMContentLoaded", function () {
    Telegram.WebApp.ready();

    let user = Telegram.WebApp.initDataUnsafe.user;
    let userCard = document.getElementById("usercard");

    if (user) {
        let phoneNumber = user.phone_number ? user.phone_number : "Phone not shared";
        userCard.innerHTML = `
            <div class="user-info">
                <img src="${user.photo_url || 'src/imgs/default_avatar.png'}" alt="User Avatar">
                <div class="user-details">
                    <p>${user.first_name} (@${user.username || 'No username'})</p>
                    <p>📞 ${phoneNumber}</p>
                </div>
            </div>
        `;
    } else {
        userCard.innerHTML = "<p>Unable to fetch user data!</p>";
    }
});

// Page Navigation
function goToPage(page) {
    window.location.href = page;
}

// Redirect to Buy Stars Page
function redirectToBuyStar() {
    window.location.href = "buystar.html";
}

// Dark Theme Toggle
const themeToggle = document.getElementById("theme-toggle");
themeToggle.addEventListener("click", function () {
    document.body.classList.toggle("dark-theme");
    themeToggle.innerText = document.body.classList.contains("dark-theme") ? "☀️ Light Mode" : "🌙 Dark Mode";
});
