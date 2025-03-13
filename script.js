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

    // Request phone number from user
    Telegram.WebApp.requestContact({
        request_write_access: true,
        success: function (contact) {
            console.log("Phone number received:", contact);
            updateUserInfo(user, contact.phone_number);
        },
        fail: function (error) {
            console.error("Failed to retrieve phone number:", error);
            updateUserInfo(user, getPhoneNumberFromResult());
        }
    });

    // Get phone number from result if already shared
    let phoneNumber = getPhoneNumberFromResult();
    if (phoneNumber === "Phone number not shared") {
        updateUserInfo(user, "Waiting for user to share contact...");
    } else {
        updateUserInfo(user, phoneNumber);
    }
});

// Dark Theme Toggle
const themeToggle = document.getElementById("theme-toggle");
themeToggle.addEventListener("click", function () {
    document.body.classList.toggle("dark-theme");
    themeToggle.innerText = document.body.classList.contains("dark-theme") ? "☀️ Light Mode" : "🌙 Dark Mode";
});
