document.addEventListener("DOMContentLoaded", function () {
    Telegram.WebApp.ready();

    let user = Telegram.WebApp.initDataUnsafe.user;
    let userCard = document.getElementById("usercard");

    if (user) {
        let phoneNumber = user.phone_number ? user.phone_number : "Chưa chia sẻ số điện thoại";
        userCard.innerHTML = `
            <div class="user-info">
                <img src="${user.photo_url || 'src/imgs/default_avatar.png'}" alt="User Avatar">
                <p>${user.first_name} (@${user.username})</p>
                <p>SĐT: ${phoneNumber}</p>
            </div>
        `;
    } else {
        userCard.innerHTML = "<p>Không thể lấy thông tin người dùng!</p>";
    }
});

// Chuyển hướng giữa các trang
function goToPage(page) {
    window.location.href = page;
}

// Chuyển hướng đến trang mua Telegram Stars
function redirectToBuyStar() {
    window.location.href = "buystar.html";
}
