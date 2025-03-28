const STAR_TO_USD_RATE = 7 / 1000; // 1000 sao = 7 USD
let tonRate = 1; // Giá TON theo USD

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
        console.log("Tỷ giá TON/USD:", tonRate);
    } catch (error) {
        console.error("Lỗi khi lấy tỷ giá TON:", error);
    }
}

// Chọn gói Stars và tính TON nhận được
function selectStars(button, amount) {
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
    const userId = Telegram.WebApp.initDataUnsafe.user.id;
    const selectedAmount = document.getElementById("selectedAmount").value;

    try {
        const response = await fetch("/create-invoice", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, amount: selectedAmount })
        });

        const data = await response.json();
        if (data.success) {
            Telegram.WebApp.openInvoice({ slug: data.slug }); // Mở thanh toán
        } else {
            Swal.fire("Lỗi", "Không thể tạo invoice!", "error");
        }
    } catch (error) {
        console.error("Lỗi gửi yêu cầu:", error);
    }
}


// Xử lý kết quả thanh toán
Telegram.WebApp.onEvent("invoiceClosed", function (result) {
    if (result.status === "paid") {
        alert("Thanh toán thành công! Stars đã được thêm vào tài khoản.");
    } else {
        alert("Thanh toán bị hủy hoặc thất bại.");
    }
});

// Gọi API ngay khi load trang
fetchTonRate();
