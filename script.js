document.addEventListener("DOMContentLoaded", function () {
    Telegram.WebApp.ready();

    let user = Telegram.WebApp.initDataUnsafe?.user || null;
    let userCard = document.getElementById("usercard");

    // Extract phone number from result
    function getPhoneNumberFromResult(result) {
        try {
            let params = new URLSearchParams(result);
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

    // Update user info in the UI
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

    // Request contact using `getRequestedContact`
    Telegram.WebApp.getRequestedContact({
        success: function (response) {
            console.log("Received contact data:", response);
            let phoneNumber = getPhoneNumberFromResult(response.result);
            updateUserInfo(user, phoneNumber);
        },
        fail: function (error) {
            console.error("Failed to retrieve phone number:", error);
            updateUserInfo(user, "Phone number not shared");
        }
    });

    // Dark Theme Toggle
    const themeToggle = document.getElementById("theme-toggle");
    themeToggle.addEventListener("click", function () {
        document.body.classList.toggle("dark-theme");
        themeToggle.innerText = document.body.classList.contains("dark-theme") ? "☀️ Light Mode" : "🌙 Dark Mode";
    });
});
