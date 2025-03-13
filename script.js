document.addEventListener("DOMContentLoaded", function () {
    Telegram.WebApp.ready();

    let user = Telegram.WebApp.initDataUnsafe.user;
    let userCard = document.getElementById("usercard");

    // Function to update user information
    function updateUserInfo(user, phoneNumber) {
        if (user) {
            userCard.innerHTML = `
                <div class="user-info">
                    <img src="${user.photo_url || 'src/imgs/default_avatar.png'}" alt="User Avatar">
                    <div class="user-details">
                        <p>${user.first_name} (@${user.username || 'No username'})</p>
                        <p>📞 ${phoneNumber || "Phone number not shared"}</p>
                    </div>
                </div>
            `;
        } else {
            userCard.innerHTML = "<p>Unable to fetch user data!</p>";
        }
    }

    // Initially display user info
    updateUserInfo(user, "Fetching phone number...");

    // Request phone number
    Telegram.WebApp.requestContact({
        request_write_access: true,
        success: function (contact) {
            console.log("Phone number received:", contact);
            updateUserInfo(user, contact.phone_number);
        },
        fail: function (error) {
            console.error("Failed to retrieve phone number:", error);
            updateUserInfo(user, "Phone number not shared");
        }
    });
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
