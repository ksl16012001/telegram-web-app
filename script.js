document.addEventListener("DOMContentLoaded", function () {
    Telegram.WebApp.ready();

    let user = Telegram.WebApp.initDataUnsafe?.user || null;
    let userCard = document.getElementById("usercard");

    // Function to extract phone number from result
    function getPhoneNumberFromResult() {
        try {
            let params = new URLSearchParams(Telegram.WebApp.initData);
            let contactData = params.get("contact");

            if (contactData) {
                let decodedData = decodeURIComponent(contactData);
                let contactJson = JSON.parse(decodedData);
                return contactJson.phone_number || "Phone number not available";
            }
        } catch (error) {
            console.error("Error parsing contact data:", error);
        }
        return "Phone number not shared";
    }

    // Function to update user information
    function updateUserInfo(user, phoneNumber) {
        if (user) {
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
    }

    // Get phone number from result and update UI
    let phoneNumber = getPhoneNumberFromResult();
    updateUserInfo(user, phoneNumber);
});

// Dark Theme Toggle
const themeToggle = document.getElementById("theme-toggle");
themeToggle.addEventListener("click", function () {
    document.body.classList.toggle("dark-theme");
    themeToggle.innerText = document.body.classList.contains("dark-theme") ? "☀️ Light Mode" : "🌙 Dark Mode";
});
