const STAR_TO_USD_RATE = 7 / 1000; // 1000 sao = 7 USD
let tonRate = 1; // Giá TON theo USD

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
}

function swapNow() {
    alert("Yêu cầu swap đã gửi!");
}

// Gọi API ngay khi load trang
fetchTonRate();
