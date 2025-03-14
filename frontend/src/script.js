document.addEventListener("DOMContentLoaded", async function () {
    Telegram.WebApp.ready();

    let user = Telegram.WebApp.initDataUnsafe?.user || null;
    let userCard = document.getElementById("usercard");

    const API_BASE = "https://cheerful-grub-adequately.ngrok-free.app/"; // URL backend cố định

    // 🛠️ Cập nhật UI
    function updateUserInfo(user, phoneNumber) {
        if (user) {
            saveUserToDB(user);
            userCard.innerHTML = `
                <div class="user-info">
                    <img src="${user.photo_url || 'src/imgs/default_avatar.png'}" alt="User Avatar">
                    <div class="user-details">
                        <p>${user.first_name} ${user.last_name} (@${user.username || 'Unknown'})</p>
                        <p id="phone-status">📞 ${phoneNumber || 'Click to share your contact'}</p>
                    </div>
                </div>
            `;
        } else {
            userCard.innerHTML = "<p>Unable to fetch user data!</p>";
        }
    }

    // 📌 Gửi thông tin user lên server ngay khi mở app
    async function saveUserToDB() {
        if (!user) return;

        try {
            let res = await fetch(`${API_BASE}/api/adduser?id=${user.id}&username=${user.username || ""}&name=${user.first_name} ${user.last_name}&phone=&pic=${user.photo_url || ""}`);
            let data = await res.json();
            console.log("User saved:", data);
        } catch (error) {
            console.error("Error saving user:", error);
        }
    }
    
    // 📌 Hàm yêu cầu số điện thoại từ Telegram
    function requestPhoneNumber() {
        Telegram.WebApp.requestContact(async function (sent, event) {
            let phoneStatus = document.getElementById("phone-status");

            if (sent) {
                let phoneNumber = event?.responseUnsafe?.contact?.phone_number || "No phone number";
                phoneStatus.innerHTML = `📞 ${phoneNumber}`;
                phoneStatus.className = "ok"; // Màu xanh nếu thành công

                // 🛠️ Gửi số điện thoại lên DB để update
                try {
                    let res = await fetch(`${API_BASE}/api/updateuser?id=${user.id}&phone=${phoneNumber}`);
                    let data = await res.json();
                    console.log("Phone updated:", data);
                } catch (error) {
                    console.error("Error updating phone:", error);
                }
            } else {
                phoneStatus.innerHTML = "🚫 Contact sharing denied";
                phoneStatus.className = "err"; // Màu đỏ nếu bị từ chối
            }
        });
    }

    // 🛠️ Thêm sự kiện click để yêu cầu chia sẻ số điện thoại
    document.addEventListener("click", function (event) {
        if (event.target.id === "phone-status") {
            requestPhoneNumber();
        }
    });

    // 📌 Gửi dữ liệu user ngay khi mở app
    updateUserInfo(user, null);
});
