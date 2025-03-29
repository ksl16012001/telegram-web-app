document.addEventListener("DOMContentLoaded", async function () {
    Telegram.WebApp.ready();
    let user = Telegram.WebApp.initDataUnsafe?.user || null;
    let id = user?.id || "null";
    let userCard = document.getElementById("usercard");

    const bottomMenu = document.createElement("div");
    bottomMenu.className = "bottom-menu";
    bottomMenu.innerHTML = `
        <button onclick="location.href='index.html'">Home</button>
        <button onclick="location.href='swapstar.html'">Swap Star</button>
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
                        <p id="phone-status">📞 +${phoneNumber}</p>
                    </div>
                </div>
            `;
        } else {
            userCard.innerHTML = "<p>❌ Unable to fetch user data!</p>";
        }
    }

    async function checkUserContact(user) {
        if (!user?.id) {
            console.warn("⚠️ User ID is missing!");
            return;
        }

        const apiUrl = `/api/getuser?id=${encodeURIComponent(user.id)}`;
        
        try {
            let response = await fetch(apiUrl);
            let data = await response.json();

            if (data?.user?.phone) {
                console.log("✅ User already has phone:", data.user.phone);
                updateUserInfo(user, data.user.phone); // ✅ Cập nhật UI với số điện thoại có sẵn
            } else {
                console.warn("⚠️ No phone found, requesting contact...");
                let phoneNumber = await requestPhoneNumber(user);
                updateUserInfo(user, phoneNumber);
                await updatePhoneNumber(user.id, phoneNumber);
            }
        } catch (error) {
            console.error("❌ Error checking user contact:", error);
        }
    }

    async function saveUserToDB(user, phoneNumber = "") {
        if (!user?.id) {
            console.error("❌ User ID is missing!");
            return;
        }

        const apiUrl = `/api/adduser?id=${encodeURIComponent(user.id)}
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

    async function updatePhoneNumber(id, phoneNumber) {
        console.log("📌 Sending phone update to API:", phoneNumber, id);

        const apiUrl = `/api/updateuser?id=${encodeURIComponent(id)}
            &phone=${encodeURIComponent(phoneNumber)}`.replace(/\s+/g, '');

        $.getJSON(apiUrl)
            .done(function (data) {
                if (data.message.includes("✅")) {
                    console.log("✅ Phone updated successfully:", data);
                    updateUserInfo(user, phoneNumber); // ✅ Cập nhật UI
                } else {
                    console.error("⚠️ Error from server:", data);
                }
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                console.error("❌ Error updating phone:", textStatus, errorThrown);
            });
    }

    async function requestPhoneNumber(user) {
        return new Promise((resolve, reject) => {
            Telegram.WebApp.requestContact(function (sent, event) {
                if (sent) {
                    let phoneNumber = event?.responseUnsafe?.contact?.phone_number || "";
                    console.log("📌 Phone Number Received:", phoneNumber);
                    resolve(phoneNumber);
                } else {
                    reject("User denied contact sharing.");
                }
            });
        });
    }

    // 📌 Lưu thông tin user (không có phone trước)
    await saveUserToDB(user);

    // 📌 Kiểm tra số điện thoại và cập nhật nếu cần
    await checkUserContact(user);
});