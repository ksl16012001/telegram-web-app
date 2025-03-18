document.addEventListener("DOMContentLoaded", async function () {
    Telegram.WebApp.ready();
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
    const bottomMenu = document.createElement("div");
    bottomMenu.className = "bottom-menu";
    bottomMenu.innerHTML = `
        <button onclick="location.href='index.html'">Home</button>
        <button onclick="location.href='buystar.html'">Buy Stars</button>
        <button onclick="location.href='buypre.html'">Buy Premium</button>
        <button onclick="location.href='profile.html'">Profile</button>
    `;
    document.body.appendChild(bottomMenu);
    let tonPriceInUsd = await fetchTonPrice();
    if (!tonPriceInUsd) {
        document.getElementById("tonPrice").innerText = "❌ Failed to load TON price";
        return;
    }

    document.querySelectorAll(".subscription-options div").forEach(option => {
        option.addEventListener("click", function () {
            document.querySelectorAll(".subscription-options div").forEach(div => div.classList.remove("selected"));
            this.classList.add("selected");

            // Cập nhật giá TON
            const priceInUsd = parseFloat(this.getAttribute("data-price"));
            const tonAmount = (priceInUsd / tonPriceInUsd).toFixed(2);
            document.getElementById("tonPrice").innerText = `💰 ${tonAmount} TON`;
        });
    });
});

// 🔹 Lấy giá TON/USD từ API
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

// 🔹 Xử lý đặt mua Premium
async function buyPremium(serviceType) {
    const selectedOption = document.querySelector(".subscription-options .selected");
    const username = document.getElementById("username-input").value.trim();

    // 🔹 Lấy userId từ Telegram WebApp
    let user = Telegram.WebApp.initDataUnsafe?.user || null;
    let userId = user?.id || "null";

    if (!username || !selectedOption) {
        Swal.fire({
            icon: "warning",
            title: "⚠️ Missing Information",
            text: "Please select a subscription and enter a valid username.",
            confirmButtonColor: "#3085d6",
            confirmButtonText: "OK"
        });
        return;
    }

    const amount = selectedOption.getAttribute("data-months"); // 🔹 `amount` giờ là số tháng
    const price = parseFloat(selectedOption.getAttribute("data-price"));
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

    const tonAmount = (price / tonPriceInUsd) + 0.01;

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
    const paymentLink = `https://app.tonkeeper.com/transfer/UQDUIxkuAb8xjWpRQVyxGse3L3zN6dbmgUG1OK2M0EQdkxDg?amount=${Math.round(tonAmount * 1e9)}&text=${encodeURIComponent(orderId)}`;

    // 🔹 Gửi order lên backend
    const queryParams = new URLSearchParams({
        userId: userId,
        amount: amount, // 🔹 Số tháng thay vì số sao
        username: username,
        price: price,
        tonAmount: tonAmount,
        paymentLink: paymentLink,
        orderId: orderId,
        service: serviceType // 🔹 Gửi loại dịch vụ (Buy Star hoặc Buy Premium)
    }).toString();

    fetch(`/api/process-payment?${queryParams}`, { method: "GET" });

    // 🔹 Hiển thị thông tin đơn hàng
    showOrderModal(orderId, username, amount + " Months", price, tonAmount, paymentLink);

    // 🔹 Mở link thanh toán
    window.open(paymentLink, "_blank");
}


// 🔹 Mã hóa `orderId` bằng SHA-256 để tránh trùng lặp
async function generateOrderId(username, months) {
    const rawOrderId = `${Date.now()}-${username}-${months}-${Math.random().toString(36).substring(2, 10)}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(rawOrderId);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(byte => byte.toString(16).padStart(2, "0")).join("").substring(0, 20);
}

// 🔹 Hiển thị modal đơn hàng
function showOrderModal(orderId, username, months, price, tonAmount, paymentLink) {
    const modalHTML = `
    <div id="order-modal-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
        background: rgba(0, 0, 0, 0.4); display: flex; align-items: center; justify-content: center; z-index: 1000;">
        <div id="order-modal" style="background: black; padding: 25px; border-radius: 10px; width: 400px; text-align: center;">
            <h2 style="color: white;">Order Details</h2>
            <p><strong>Order ID:</strong> ${orderId}</p>
            <p><strong>Username:</strong> ${username}</p>
            <p><strong>Months:</strong> ${months}</p>
            <p><strong>Price:</strong> $${price}</p>
            <p><strong>TON Amount:</strong> ${tonAmount} TON</p>
            <button onclick="checkTransaction('${orderId}')">✅ Check Transaction</button>
            <button onclick="cancelOrder('${orderId}')">❌ Cancel Order</button>
            <button onclick="document.getElementById('order-modal-overlay').remove()">Close</button>
        </div>
    </div>`;

    document.body.insertAdjacentHTML("beforeend", modalHTML);
}

// 🔹 API kiểm tra giao dịch
async function checkTransaction(orderId) {
    fetch("/api/check-transaction", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId })
    }).then(response => response.json()).then(data => alert(data.message));
}

// 🔹 API hủy đơn hàng
async function cancelOrder(orderId) {
    fetch("/api/cancel-order", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId })
    }).then(response => response.json()).then(data => alert(data.message));
}
