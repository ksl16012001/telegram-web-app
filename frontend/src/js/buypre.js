document.addEventListener("DOMContentLoaded", async function () {
    Telegram.WebApp.ready();
    let user = Telegram.WebApp.initDataUnsafe?.user || null;
    const usernameInput = document.getElementById("username-input");
    const purchaseTypeRadios = document.querySelectorAll('input[name="purchase-type"]');
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
    purchaseTypeRadios.forEach(radio => {
        radio.addEventListener("change", updateRecipient);
    });
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
            const priceInUsd = parseFloat(this.getAttribute("data-price"));
            const tonAmount = (priceInUsd / tonPriceInUsd).toFixed(2);
            document.getElementById("tonPrice").innerText = `💰 ${tonAmount} TON`;
        });
    });
});
async function fetchTonPrice() {
    try {
        const response = await fetch('https://tonapi.io/v2/rates?tokens=ton&currencies=usd');
        const data = await response.json();
        return data.rates.TON.prices.USD; 
    } catch (error) {
        console.error('Error fetching TON price:', error);
        return null;
    }
}
async function fetchTonReceiver() {
    try {
        const response = await fetch("/api/get-ton-receiver");
        const data = await response.json();

        if (data.success) {
            console.log("✅ TON Receiver:", data.TON_RECEIVER);
            return data.TON_RECEIVER;
        } else {
            console.error("❌ Err TON_RECEIVER:", data.error);
            return null;
        }
    } catch (error) {
        console.error("❌ API ERR:", error);
        return null;
    }
}

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

    const amount = selectedOption.getAttribute("data-months"); 
    const price = parseFloat(selectedOption.getAttribute("data-price"));
    
    // 🔹 Lấy tỷ giá TON
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

    // 🔹 Lấy địa chỉ TON Receiver
    const tonReceiver = await fetchTonReceiver();
    if (!tonReceiver) {
        Swal.fire({
            icon: "error",
            title: "❌ Receiver Error",
            text: "Failed to fetch TON receiver. Please try again later.",
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

    // 🔹 Tạo 2 link thanh toán với địa chỉ TON Receiver động
    const tonkeeperLink = `tonkeeper://transfer/${tonReceiver}?amount=${Math.round(tonAmount * 1e9)}&text=${encodeURIComponent(orderId)}`;
    const paymentLink = `https://app.tonkeeper.com/transfer/${tonReceiver}?amount=${Math.round(tonAmount * 1e9)}&text=${encodeURIComponent(orderId)}`;

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

    // 🔹 Hiển thị modal chọn cách thanh toán
    showOrderModal(orderId, username, amount + " Months", price, tonAmount, tonkeeperLink, paymentLink);
}
async function generateOrderId(username, months) {
    const rawOrderId = `${Date.now()}-${username}-${months}-${Math.random().toString(36).substring(2, 10)}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(rawOrderId);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(byte => byte.toString(16).padStart(2, "0")).join("").substring(0, 20);
}
function showOrderModal(orderId, username, amount, price, tonAmount, paymentLink) {
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
        <p style="font-size: 16px;"><strong>Amount:</strong> ${amount}</p>
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
            background-color: #007bff; color: white; border: none; padding: 10px 15px;
            font-size: 14px; border-radius: 5px; cursor: pointer; margin-top: 20px;
        ">Close</button>
    </div>
</div>
`;
    const existingModal = document.getElementById("order-modal-overlay");
    if (existingModal) {
        existingModal.remove();
    }
    const modal = document.createElement("div");
    modal.innerHTML = modalHTML;
    document.body.appendChild(modal);
}

// async function checkTransaction(orderId) {
//     fetch("/api/check-transaction", {
//         method: "POST", headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ orderId })
//     }).then(response => response.json()).then(data => alert(data.message));
// }

// async function cancelOrder(orderId) {
//     fetch("/api/cancel-order", {
//         method: "POST", headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ orderId })
//     }).then(response => response.json()).then(data => alert(data.message));
// }
