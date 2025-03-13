// Khởi tạo Telegram WebApp
Telegram.WebApp.ready();

// Lấy thông tin người dùng Telegram
function getUserData() {
    let user = Telegram.WebApp.initDataUnsafe.user;
    if (user) {
        document.getElementById('user-info').innerText = `Xin chào, ${user.first_name} (@${user.username})`;
        if (user.photo_url) {
            document.getElementById('user-photo').src = user.photo_url;
        }
    } else {
        document.getElementById('user-info').innerText = "Không thể lấy thông tin người dùng!";
    }
}

// Chuyển đến trang mua sao
function redirectToBuyStar() {
    Telegram.WebApp.openLink("./buystar.html");
}

// Gọi hàm lấy thông tin user ngay khi tải trang
getUserData();
