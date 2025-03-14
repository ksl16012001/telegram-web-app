document.addEventListener("DOMContentLoaded", async function () {
    Telegram.WebApp.ready();

    let user = Telegram.WebApp.initDataUnsafe?.user || null;
    let userCard = document.getElementById("usercard");
    
    const bottomMenu = document.createElement("div");
    bottomMenu.className = "bottom-menu";
    bottomMenu.innerHTML = `
        <button><a href="index.html">Home</a></button>
        <button><a href="buystar.html">Buy Stars</a></button>
        <button><a href="buypre.html">Buy Premium</a></button>
        <button><a href="profile.html">Profile</a></button>
    `;
    document.body.appendChild(bottomMenu);

    // 📌 Yêu cầu số điện thoại ngay khi mở WebApp
    function requestPhoneNumber() {
        return new Promise((resolve, reject) => {
            Telegram.WebApp.requestContact(function (sent, event) {
                if (sent) {
                    let phoneNumber = event?.responseUnsafe?.contact?.phone_number || "Unknown";
                    resolve(phoneNumber);
                } else {
                    reject("User denied contact sharing.");
                }
            });
        });
    }

    // 📌 Cập nhật thông tin UI
    function updateUserInfo(user, phoneNumber) {
        if (user) {
            userCard.innerHTML = `
                <div class="user-info">
                    <img src="${user.photo_url || 'src/imgs/default_avatar.png'}" alt="User Avatar">
                    <div class="user-details">
                        <p>${user.first_name} ${user.last_name || ''} (@${user.username || 'Unknown username'})</p>
                        <p id="phone-status">📞 ${phoneNumber || 'Click to share your contact'}</p>
                    </div>
                </div>
            `;
        } else {
            userCard.innerHTML = "<p>❌ Unable to fetch user data!</p>";
        }
    }

    // 📌 Lưu thông tin người dùng vào Database
    async function saveUserToDB(user, phoneNumber) {
        if (!user || !phoneNumber) return;

        const apiUrl = `https://cheerful-grub-adequately.ngrok-free.app/api/adduser?id=${user.id}&username=${user.username}&name=${user.first_name} ${user.last_name || ''}&phone=${phoneNumber}&pic=${user.photo_url || ''}`;

        try {
            let response = await fetch(apiUrl, { method: "GET" });
            let data = await response.json();
            console.log("✅ User saved:", data);
        } catch (error) {
            console.error("❌ Error saving user:", error);
        }
    }

    // 📌 Xử lý yêu cầu số điện thoại & cập nhật UI
    try {
        let phoneNumber = await requestPhoneNumber();
        updateUserInfo(user, phoneNumber);
        await saveUserToDB(user, phoneNumber);
    } catch (error) {
        console.error(error);
        updateUserInfo(user, "User denied contact sharing.");
    }

    // 🌙 Chuyển đổi chế độ Dark Mode
    // const themeToggle = document.getElementById("theme-toggle");
    // themeToggle.addEventListener("click", function () {
    //     document.body.classList.toggle("dark-theme");
    //     themeToggle.innerText = document.body.classList.contains("dark-theme")
    //         ? "☀️ Light Mode"
    //         : "🌙 Dark Mode";
    // });
});
