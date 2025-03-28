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
function swapNow() {
    let amount = document.getElementById("selectedAmount").value;
    if (!amount) {
        alert("Vui lòng chọn số lượng Stars!");
        return;
    }

    if (!window.Telegram || !Telegram.WebApp) {
        alert("WebApp không được hỗ trợ!");
        return;
    }
    Telegram.WebApp.openInvoice({
        title: "Stars",
        description: `Bạn đang send ${amount} Stars`,
        payload: `payment_${amount}`,
        provider_token: "", // Token từ Telegram BotFather
        currency: "XTR",
        prices: [{ label: "Stars", amount: amount * 100 }], // Telegram tính theo cent
        start_parameter: `buy_${amount}`
    });
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
