document.addEventListener("DOMContentLoaded", function () {
    Telegram.WebApp.ready();

    let user = Telegram.WebApp.initDataUnsafe?.user || null;
    let userCard = document.getElementById("usercard");

    // 🛠️ Cập nhật UI với số điện thoại
    function updateUserInfo(user, phoneNumber) {
        if (user) {
            userCard.innerHTML = `
                <div class="user-info">
                    <img src="${user.photo_url || 'src/imgs/default_avatar.png'}" alt="User Avatar">
                    <div class="user-details">
                        <p>${user.first_name} (@${user.username || 'Không có username'})</p>
                        <p id="phone-status">📞 ${phoneNumber || 'Nhấn để chia sẻ số điện thoại'}</p>
                    </div>
                </div>
            `;
        } else {
            userCard.innerHTML = "<p>Không thể lấy dữ liệu người dùng!</p>";
        }
    }

    // 📌 Hàm yêu cầu số điện thoại từ Telegram
    function requestPhoneNumber() {
        Telegram.WebApp.requestContact(function (sent, event) {
            let phoneStatus = document.getElementById("phone-status");

            if (sent) {
                let phoneNumber =
                    event?.responseUnsafe?.contact?.phone_number || "Không có số điện thoại";
                phoneStatus.innerHTML = `📞 +${phoneNumber}`;
                phoneStatus.className = "ok"; // Đổi màu xanh lá nếu thành công
            } else {
                phoneStatus.innerHTML = "🚫 Người dùng từ chối chia sẻ số điện thoại";
                phoneStatus.className = "err"; // Đổi màu đỏ nếu bị từ chối
            }
        });
    }

    // 🛠️ Thêm sự kiện nhấn vào số điện thoại để yêu cầu chia sẻ
    document.addEventListener("click", function (event) {
        if (event.target.id === "phone-status") {
            requestPhoneNumber();
        }
    });

    // 📌 Hiển thị thông tin người dùng ngay từ đầu
    updateUserInfo(user, null);

    // 🌙 Chuyển đổi chế độ Dark Mode
    const themeToggle = document.getElementById("theme-toggle");
    themeToggle.addEventListener("click", function () {
        document.body.classList.toggle("dark-theme");
        themeToggle.innerText = document.body.classList.contains("dark-theme")
            ? "☀️ Light Mode"
            : "🌙 Dark Mode";
    });
});
