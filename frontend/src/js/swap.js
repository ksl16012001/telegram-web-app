const STAR_TO_USD_RATE = 7 / 1000; // 1000 Stars = 7 USD
let tonRate = 1; // Giá TON theo USD, mặc định là 1

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

// Lấy tỷ giá TON theo USD từ API
async function fetchTonRate() {
    try {
        let response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd");
        let data = await response.json();
        tonRate = data["the-open-network"].usd;
        if (!tonRate) throw new Error("Tỷ giá TON/USD không hợp lệ!");
        console.log("✅ Tỷ giá TON/USD:", tonRate);
    } catch (error) {
        console.error("❌ Lỗi khi lấy tỷ giá TON:", error);
        tonRate = 1; // Dùng giá trị mặc định nếu có lỗi
    }
}

// Chọn gói Stars và tính TON nhận được
function selectStars(button, amount) {
    if (!tonRate || tonRate <= 0) {
        alert("⚠️ Không thể tính tỷ giá, vui lòng thử lại sau!");
        return;
    }

    let usdValue = amount * STAR_TO_USD_RATE; // Chuyển từ Stars sang USD
    let tonAmount = usdValue / tonRate; // Chuyển từ USD sang TON

    document.getElementById("tonAmount").innerText = tonAmount.toFixed(6) + " TON";

    // Đặt trạng thái active
    document.querySelectorAll('.star-option').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    // Cập nhật số Stars để thanh toán
    document.getElementById("selectedAmount").value = amount;
}

// Mở popup thanh toán bằng Telegram Payment
async function swapNow() {
    if (!Telegram.WebApp.initDataUnsafe || !Telegram.WebApp.initDataUnsafe.user) {
        alert("⚠️ Không thể xác định tài khoản Telegram. Vui lòng mở lại WebApp!");
        return;
    }

    const userId = Telegram.WebApp.initDataUnsafe.user.id;
    const selectedAmount = document.getElementById("selectedAmount").value;

    if (!selectedAmount || selectedAmount <= 0) {
        alert("⚠️ Vui lòng chọn số lượng Stars cần swap!");
        return;
    }

    try {
        const response = await fetch("/create-invoice", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, amount: selectedAmount })
        });

        const data = await response.json();
        if (data.success && data.invoice) {
            Telegram.WebApp.openTelegramLink(data.invoice.link); // Đúng cú pháp mở Invoice
        } else {
            Swal.fire("❌ Lỗi", "Không thể tạo invoice!", "error");
        }
    } catch (error) {
        console.error("❌ Lỗi gửi yêu cầu:", error);
        Swal.fire("❌ Lỗi", "Có lỗi xảy ra, vui lòng thử lại sau!", "error");
    }
}

// Xử lý kết quả thanh toán
Telegram.WebApp.onEvent("invoiceClosed", function (result) {
    if (result.status === "paid") {
        Swal.fire("🎉 Thành công", "Thanh toán thành công! Stars đã được thêm vào tài khoản.", "success");
    } else {
        Swal.fire("⚠️ Thất bại", "Thanh toán bị hủy hoặc thất bại.", "error");
    }
});

// Gọi API ngay khi load trang
fetchTonRate();
