document.addEventListener("DOMContentLoaded", function () {
    const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
        manifestUrl: 'https://<YOUR_APP_URL>/tonconnect-manifest.json',
        buttonRootId: 'orderButton'
    });
    let user = Telegram.WebApp.initDataUnsafe?.user || null;
    const usernameInput = document.getElementById("username-input");
    const purchaseTypeRadios = document.querySelectorAll('input[name="purchase-type"]');

    // 📌 Cập nhật giá trị input theo chế độ mua
    function updateRecipient() {
        const selectedOption = document.querySelector('input[name="purchase-type"]:checked').value;
        if (selectedOption === "self") {
            usernameInput.value = user?.username || "No username found";
            usernameInput.disabled = true;
        } else {
            usernameInput.value = "";
            usernameInput.disabled = false;
        }
    }

    // 📌 Gán sự kiện click cho radio buttons để cập nhật ngay khi thay đổi
    purchaseTypeRadios.forEach(radio => {
        radio.addEventListener("change", updateRecipient);
    });

    // 📌 Cập nhật ngay khi trang tải xong
    updateRecipient();
});
// Danh sách gói sao và giá
const starsPackages = [
    { amount: 100, price: 1.7 }, { amount: 150, price: 2.55 }, { amount: 250, price: 4.25 },
    { amount: 350, price: 5.95 }, { amount: 500, price: 8.5 }, { amount: 750, price: 12.75 },
    { amount: 1000, price: 16.5 }, { amount: 1500, price: 25 }, { amount: 2500, price: 42 },
    { amount: 5000, price: 84 }, { amount: 10000, price: 165 }, { amount: 25000, price: 410 },
    { amount: 35000, price: 570 }, { amount: 50000, price: 810 }, { amount: 100000, price: 1600 },
    { amount: 150000, price: 2380 }, { amount: 500000, price: 7700 }, { amount: 1000000, price: 15500 }
];

const starList = document.getElementById("starList");
const selectedPackageDiv = document.getElementById("selectedPackage");
const selectedAmount = document.getElementById("selectedAmount");
const selectedPrice = document.getElementById("selectedPrice");
const orderButton = document.getElementById("orderButton");
function formatAmount(amount) {
    if (amount >= 1000000) {
        return (amount / 1000000) + 'M';
    }
    if (amount >= 1000) {
        return (amount / 1000) + 'K';
    }
    return amount.toString();
}
// Hiển thị danh sách gói sao
starsPackages.forEach((pkg, index) => {
    const item = document.createElement("div");
    item.className = "star-item";
    item.innerHTML = `${formatAmount(pkg.amount)} ⭐`;

    item.onclick = function () {
        selectStarPackage(index, pkg.amount, pkg.price);
    };

    starList.appendChild(item);
});

// Chọn gói sao
function selectStarPackage(index, amount, price) {
    document.querySelectorAll('.star-item').forEach(item => item.classList.remove('selected'));
    document.querySelectorAll('.star-item')[index].classList.add('selected');

    // Hiển thị gói đã chọn
    selectedPackageDiv.style.display = 'block';
    selectedAmount.textContent = `Number of stars: ${formatAmount(amount)}`;
    selectedPrice.textContent = `Price: ~ $${price.toFixed(2)}`;

    // Cập nhật nội dung nút
    orderButton.innerText = `Order ${amount} Stars`;
    orderButton.setAttribute("data-amount", amount);
    orderButton.setAttribute("data-price", price);
}

// Xử lý thanh toán
async function fetchTonPrice() {
    try {
        const response = await fetch('https://tonapi.io/v2/rates?tokens=ton&currencies=usd');
        const data = await response.json();
        return data.rates.TON.prices.USD; // Lấy tỷ giá USD/TON
    } catch (error) {
        console.error('Error fetching TON price:', error);
        return null;
    }
}

async function buyStars(serviceType) {
    const amount = orderButton.getAttribute("data-amount");
    const price = orderButton.getAttribute("data-price");
    const username = document.getElementById("username-input").value.trim();

    let user = Telegram.WebApp.initDataUnsafe?.user || null;
    let userId = user?.id || "null";

    if (!amount || !price || !username) {
        Swal.fire({
            icon: "warning",
            title: "⚠️ Missing Information",
            text: "Please select a star package and enter a valid username.",
            confirmButtonColor: "#3085d6",
            confirmButtonText: "OK"
        });
        return;
    }

    const tonPriceInUsd = await fetchTonPrice();
    if (!tonPriceInUsd) {
        Swal.fire({
            icon: "error",
            title: "❌ TON Price Error",
            text: "Failed to fetch TON price. Please try again later.",
            confirmButtonColor: "#d33",
            confirmButtonText: "Retry"
        });
        return;
    }

    const tonAmount = (price / tonPriceInUsd + 0.01).toFixed(2);

    // 🔹 Tạo orderId duy nhất
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 10);
    const rawOrderId = `${timestamp}-${username}-${amount}-${randomString}`;

    // 🔹 Mã hóa orderId bằng SHA-256
    const encoder = new TextEncoder();
    const data = encoder.encode(rawOrderId);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const orderId = hashArray.map(byte => byte.toString(16).padStart(2, "0")).join("").substring(0, 20);

    // 🔹 Tạo link thanh toán
    const tonkeeperLink = `tonkeeper://transfer/UQCXXeVeKrgfsPdwczOkxn9a1oItWNu-RB_vXS8hP_9jCEJ0?amount=${Math.round(tonAmount * 1e9)}&text=${encodeURIComponent(orderId)}`;
    const paymentLink = `https://app.tonkeeper.com/transfer/UQCXXeVeKrgfsPdwczOkxn9a1oItWNu-RB_vXS8hP_9jCEJ0?amount=${Math.round(tonAmount * 1e9)}&text=${encodeURIComponent(orderId)}`;

    // 🔹 Gửi order lên backend
    const queryParams = new URLSearchParams({
        userId: userId,
        amount: amount,
        username: username,
        price: price,
        tonAmount: tonAmount,
        paymentLink: paymentLink,
        orderId: orderId,
        service: serviceType
    }).toString();

    fetch(`/api/process-payment?${queryParams}`, { method: "GET" });

    // 🔹 Hiển thị modal để chọn cách thanh toán
    showOrderModal(orderId, username, amount, price, tonAmount, tonkeeperLink, paymentLink);
}


// ✅ Hiển thị hộp thoại đơn hàng
function showOrderModal(orderId, username, amount, price, tonAmount, tonkeeperLink, paymentLink) {
    const modalHTML = `
<div id="order-modal-overlay" style="
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0, 0, 0, 0.4); display: flex; align-items: center; justify-content: center;
    z-index: 1000;
">
    <div id="order-modal" style="
        background: black; padding: 25px; border-radius: 10px; width: 400px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3); text-align: center;
        font-family: Arial, sans-serif;
        position: relative;
    ">
        <h2 style="color: #fff; margin-bottom: 15px;">Order Details</h2>
        <p style="font-size: 16px;"><strong>Order ID:</strong> ${orderId}</p>
        <p style="font-size: 16px;"><strong>Username:</strong> ${username}</p>
        <p style="font-size: 16px;"><strong>Amount:</strong> ${amount} Stars</p>
        <p style="font-size: 16px;"><strong>Price:</strong> $${price}</p>
        <p style="font-size: 16px;"><strong>TON Amount:</strong> ${tonAmount} TON</p>

        <div style="margin-top: 20px;">
            <button onclick="window.open('${tonkeeperLink}', '_blank')" style="
                background-color: #28a745; color: white; border: none; padding: 10px 15px;
                font-size: 14px; border-radius: 5px; cursor: pointer; margin: 5px;
            ">💰 Pay with TON (Tonkeeper)</button>
            
            <button onclick="window.open('${paymentLink}', '_blank')" style="
                background-color: #007bff; color: white; border: none; padding: 10px 15px;
                font-size: 14px; border-radius: 5px; cursor: pointer; margin: 5px;
            ">🔗 Pay with Payment Link</button>
        </div>

        <button onclick="document.getElementById('order-modal-overlay').remove()" style="
            background-color: #dc3545; color: white; border: none; padding: 10px 15px;
            font-size: 14px; border-radius: 5px; cursor: pointer; margin-top: 20px;
        ">❌ Cancel</button>
    </div>
</div>
`;

    // Xóa modal cũ nếu có
    const existingModal = document.getElementById("order-modal-overlay");
    if (existingModal) {
        existingModal.remove();
    }

    // Thêm modal mới vào body
    const modal = document.createElement("div");
    modal.innerHTML = modalHTML;
    document.body.appendChild(modal);
}



// ✅ Gọi API kiểm tra giao dịch
async function checkTransaction(orderId) {
    try {
        const response = await fetch("/api/check-transaction", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId })
        });
        const result = await response.json();

        if (result.success) {
            Swal.fire({
                icon: "success",
                title: "✅ Transaction Verified!",
                text: `Transaction ID: ${result.transactionId}`,
                confirmButtonColor: "#28a745"
            });
        } else {
            Swal.fire({
                icon: "warning",
                title: "⚠️ Transaction Not Found!",
                text: result.message,
                confirmButtonColor: "#d33"
            });
        }
    } catch (error) {
        console.error("❌ Error checking transaction:", error);
        Swal.fire({
            icon: "error",
            title: "❌ Error",
            text: "Error checking transaction",
            confirmButtonColor: "#d33"
        });
    }
}

async function cancelOrder(orderId) {
    try {
        const response = await fetch("/api/cancel-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId })
        });
        const result = await response.json();

        if (result.success) {
            Swal.fire({
                icon: "info",
                title: "❌ Order Canceled!",
                text: "Your order has been canceled successfully.",
                confirmButtonColor: "#d33"
            });
        } else {
            Swal.fire({
                icon: "warning",
                title: "⚠️ Cannot Cancel Order!",
                text: result.message,
                confirmButtonColor: "#d33"
            });
        }
    } catch (error) {
        console.error("❌ Error canceling order:", error);
        Swal.fire({
            icon: "error",
            title: "❌ Error",
            text: "Error canceling order",
            confirmButtonColor: "#d33"
        });
    }
}
