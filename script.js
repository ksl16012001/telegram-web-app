document.addEventListener("DOMContentLoaded", function () {
    Telegram.WebApp.ready();

    let user = Telegram.WebApp.initDataUnsafe?.user || null;
    let userCard = document.getElementById("usercard");

    // Function to extract phone number from encoded result
    function getPhoneNumberFromResult(result) {
        try {
            let urlParams = new URLSearchParams(result);
            let contactData = urlParams.get("contact");

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

    // Function to update the user card UI
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

    // **Properly request the contact information**
    Telegram.WebApp.onEvent("custom_method_invoked", function (response) {
        console.log("Received contact data:", response);
        let phoneNumber = getPhoneNumberFromResult(response.result);
        updateUserInfo(user, phoneNumber);
    });

    // Manually trigger the request
    Telegram.WebApp.sendData(JSON.stringify({ method: "getRequestedContact" }));

    // **Dark Mode Toggle**
    const themeToggle = document.getElementById("theme-toggle");
    themeToggle.addEventListener("click", function () {
        document.body.classList.toggle("dark-theme");
        themeToggle.innerText = document.body.classList.contains("dark-theme") ? "☀️ Light Mode" : "🌙 Dark Mode";
    });
});
