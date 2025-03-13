document.addEventListener("DOMContentLoaded", function () {
    Telegram.WebApp.ready();

    let user = Telegram.WebApp.initDataUnsafe?.user || null;
    let userCard = document.getElementById("usercard");
    let checkingContact = true; // Biến kiểm tra liên tục

    // 🛠️ Hàm giải mã và lấy số điện thoại từ `result`
    function extractPhoneNumber(result) {
        try {
            let params = new URLSearchParams(result);
            let contactData = params.get("contact");

            if (contactData) {
                let decodedData = decodeURIComponent(contactData);
                let contactJson = JSON.parse(decodedData);
                return contactJson.phone_number || "Không có số điện thoại";
            }
        } catch (error) {
            console.error("Lỗi khi xử lý dữ liệu liên hệ:", error);
        }
        return null;
    }

    // 🛠️ Cập nhật giao diện với số điện thoại
    function updateUserInfo(user, phoneNumber) {
        if (user) {
            userCard.innerHTML = `
                <div class="user-info">
                    <img src="${user.photo_url || 'src/imgs/default_avatar.png'}" alt="User Avatar">
                    <div class="user-details">
                        <p>${user.first_name} (@${user.username || 'Không có username'})</p>
                        <p>📞 ${phoneNumber || 'Đang lấy dữ liệu...'}</p>
                    </div>
                </div>
            `;
        } else {
            userCard.innerHTML = "<p>Không thể lấy dữ liệu người dùng!</p>";
        }
    }

    // 📌 Lắng nghe sự kiện từ Telegram để nhận số điện thoại
    Telegram.WebApp.onEvent("custom_method_invoked", function (response) {
        console.log("📩 Nhận dữ liệu số điện thoại:", response);
        let phoneNumber = extractPhoneNumber(response.result);

        if (phoneNumber) {
            updateUserInfo(user, phoneNumber);
            checkingContact = false; // Dừng kiểm tra khi đã có số điện thoại
        }
    });

    // 📌 Gửi yêu cầu lấy số điện thoại liên tục
    function requestPhoneNumber() {
        if (checkingContact) {
            console.log("📡 Gửi yêu cầu lấy số điện thoại...");
            Telegram.WebApp.sendData(JSON.stringify({ method: "getRequestedContact" }));
            setTimeout(requestPhoneNumber, 3000); // Kiểm tra lại sau 3 giây nếu chưa có dữ liệu
        }
    }

    // 📌 Bắt đầu kiểm tra số điện thoại liên tục
    requestPhoneNumber();

    // 🌙 Chuyển đổi chế độ Dark Mode
    const themeToggle = document.getElementById("theme-toggle");
    themeToggle.addEventListener("click", function () {
        document.body.classList.toggle("dark-theme");
        themeToggle.innerText = document.body.classList.contains("dark-theme") ? "☀️ Light Mode" : "🌙 Dark Mode";
    });
});
document.addEventListener("DOMContentLoaded", function () {
    // Tạo bottom-menu
    const bottomMenu = document.createElement("div");
    bottomMenu.className = "bottom-menu";
    bottomMenu.innerHTML = `
        <button><a href="index.html">🏠 Home</a></button>
        <button><a href="buystar.html">⭐ Stars</a></button>
        <button><a href="buypre.html">Premium</a></button>
        <button><a href="profile.html">👤 Profile</a></button>
    `;

    // Chèn vào cuối body
    document.body.appendChild(bottomMenu);
});
