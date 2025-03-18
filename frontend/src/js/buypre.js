document.addEventListener("DOMContentLoaded", async function () {
    Telegram.WebApp.ready();
    function updateRecipient() {
        const selectedOption = document.querySelector('input[name="purchase-type"]:checked').value;
        if (selectedOption === "self") {
            let user = Telegram.WebApp.initDataUnsafe?.user || null;
            usernameInput.value = user?.username || "No username found";
            usernameInput.disabled = true;
        } else {
            usernameInput.value = "";
            usernameInput.disabled = false;
        }
    }

    purchaseTypeRadios.forEach(radio => {
        radio.addEventListener("change", updateRecipient);
    });

    updateRecipient(); // Gọi lần đầu khi trang tải xong
    
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
async function buyPremium() {
    const username = document.getElementById("username-input").value.trim();
    const selectedOption = document.querySelector(".subscription-options .selected");
    if (!username) {
        alert("❌ Please enter a Telegram username");
        return;
    }

    const months = selectedOption.getAttribute("data-months");
    const priceInUsd = parseFloat(selectedOption.getAttribute("data-price"));
    const tonPriceInUsd = await fetchTonPrice();
    if (!tonPriceInUsd) {
        alert("❌ Failed to fetch TON price. Try again later.");
        return;
    }

    const tonAmount = (priceInUsd / tonPriceInUsd + 0.01).toFixed(2);
    const orderId = await generateOrderId(username, months);

    const paymentLink = `https://app.tonkeeper.com/transfer/UQDUIxkuAb8xjWpRQVyxGse3L3zN6dbmgUG1OK2M0EQdkxDg?amount=${tonAmount * 1e9}&text=${orderId}`;

    fetch(`/api/process-premium?` + 
        new URLSearchParams({
            orderId: orderId,
            username: username,
            service: "Premium",
            months: months,
            price: priceInUsd,
            tonAmount: tonAmount,
            paymentLink: paymentLink
        }), { method: "GET" });

    showOrderModal(orderId, username, months, priceInUsd, tonAmount, paymentLink);
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
