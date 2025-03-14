document.addEventListener("DOMContentLoaded", async function () {
    Telegram.WebApp.ready();

    let user = Telegram.WebApp.initDataUnsafe?.user || null;
    let userCard = document.getElementById("usercard");

    const bottomMenu = document.createElement("div");
    bottomMenu.className = "bottom-menu";
    bottomMenu.innerHTML = `
        <button onclick="location.href='index.html'">Home</button>
        <button onclick="location.href='buystar.html'">Buy Stars</button>
        <button onclick="location.href='buypre.html'">Buy Premium</button>
        <button onclick="location.href='profile.html'">Profile</button>
    `;
    document.body.appendChild(bottomMenu);

    function updateUserInfo(user, phoneNumber = "Click to share your contact") {
        if (user) {
            userCard.innerHTML = `
                <div class="user-info">
                    <img src="${user.photo_url || 'src/imgs/default_avatar.png'}" alt="User Avatar">
                    <div class="user-details">
                        <p>${user.first_name} ${user.last_name || ''} (@${user.username || 'Unknown'})</p>
                        <p id="phone-status">📞 ${phoneNumber}</p>
                    </div>
                </div>
            `;
        } else {
            userCard.innerHTML = "<p>❌ Unable to fetch user data!</p>";
        }
    }

    // 📌 Gửi yêu cầu lưu user vào DB bằng jQuery
    async function saveUserToDB(user, phoneNumber = "") {
        if (!user?.id) {
            console.error("❌ User ID is missing!");
            return;
        }

        const apiUrl = `https://telegram-web-app-k4qx.onrender.com/api/adduser?id=${encodeURIComponent(user.id)}
            &username=${encodeURIComponent(user.username || "")}
            &name=${encodeURIComponent(user.first_name + " " + (user.last_name || ""))}
            &phone=${encodeURIComponent(phoneNumber)}
            &pic=${encodeURIComponent(user.photo_url || "")}`.replace(/\s+/g, '');

        $.getJSON(apiUrl)
            .done(function (data) {
                if (data.message.includes("✅")) {
                    console.log("✅ User saved:", data);
                } else {
                    console.error("⚠️ Error from server:", data);
                }
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                console.error("❌ Error saving user:", textStatus, errorThrown);
            });
    }

    // 📌 Yêu cầu số điện thoại ngay khi mở WebApp
    async function requestPhoneNumber() {
        return new Promise((resolve, reject) => {
            Telegram.WebApp.requestContact(function (sent, event) {
                if (sent) {
                    let phoneNumber = event?.responseUnsafe?.contact?.phone_number || "";
                    // updateUserInfo(user, phoneNumber);
                    resolve(phoneNumber);
                    console.log(phoneNumber);
                    return phoneNumber;
                } else {
                    reject("User denied contact sharing.");
                }
            });
        });
    }

    // 📌 Lưu thông tin user (không có phone trước)
    await saveUserToDB(user);

    // 📌 Nếu user chia sẻ số điện thoại, cập nhật DB
    try {
        let phoneNumber = await requestPhoneNumber();
        updateUserInfo(user, phoneNumber);
        await saveUserToDB(user, phoneNumber);
    } catch (error) {
        console.warn(error);
        updateUserInfo(user, "User denied contact sharing.");
    }
});