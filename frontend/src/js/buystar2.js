document.addEventListener("DOMContentLoaded", function () {
    // ✅ Khởi tạo TonConnect UI
    const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
        manifestUrl: "https://telegram-web-app-k4qx.onrender.com/tonconnect-manifest.json",
        buttonRootId: "connect-btn"
    });

    let user = Telegram.WebApp.initDataUnsafe?.user || null;
    const usernameInput = document.getElementById("username-input");
    const purchaseTypeRadios = document.querySelectorAll('input[name="purchase-type"]');
    const starList = document.getElementById("starList");
    const selectedPackageDiv = document.getElementById("selectedPackage");
    const selectedAmount = document.getElementById("selectedAmount");
    const selectedPrice = document.getElementById("selectedPrice");
    const orderButton = document.getElementById("orderButton");

    // ✅ Danh sách gói sao
    const starsPackages = [
        { amount: 100, price: 1.7 }, { amount: 150, price: 2.55 }, { amount: 250, price: 4.25 },
        { amount: 350, price: 5.95 }, { amount: 500, price: 8.5 }, { amount: 750, price: 12.75 },
        { amount: 1000, price: 16.5 }, { amount: 1500, price: 25 }, { amount: 2500, price: 42 }
    ];

    function formatAmount(amount) {
        if (amount >= 1000000) return (amount / 1000000) + 'M';
        if (amount >= 1000) return (amount / 1000) + 'K';
        return amount.toString();
    }

    // ✅ Hiển thị danh sách gói sao
    starsPackages.forEach((pkg, index) => {
        const item = document.createElement("div");
        item.className = "star-item";
        item.innerHTML = `${formatAmount(pkg.amount)} ⭐`;
        item.onclick = function () {
            selectStarPackage(index, pkg.amount, pkg.price);
        };
        starList.appendChild(item);
    });

    function selectStarPackage(index, amount, price) {
        document.querySelectorAll('.star-item').forEach(item => item.classList.remove('selected'));
        document.querySelectorAll('.star-item')[index].classList.add('selected');

        selectedPackageDiv.style.display = 'block';
        selectedAmount.textContent = `Number of stars: ${formatAmount(amount)}`;
        selectedPrice.textContent = `Price: ~ $${price.toFixed(2)}`;

        orderButton.innerText = `Order ${amount} Stars`;
        orderButton.setAttribute("data-amount", amount);
        orderButton.setAttribute("data-price", price);
    }

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

    async function sendTransaction(tonConnectUI, orderId, tonAmount) {
        if (!tonConnectUI.wallet) {
            alert("🔗 Please connect your Ton wallet first.");
            return;
        }

        const transaction = {
            validUntil: Math.floor(Date.now() / 1000) + 600,
            messages: [
                {
                    address: "UQCXXeVeKrgfsPdwczOkxn9a1oItWNu-RB_vXS8hP_9jCEJ0",
                    amount: Math.round(tonAmount * 1e9).toString(),
                    payload: orderId
                }
            ]
        };

        try {
            await tonConnectUI.sendTransaction(transaction);
            alert(`✅ Payment Sent Successfully! (${tonAmount} TON)`);
        } catch (error) {
            alert("❌ Payment Failed!");
            console.error(error);
        }
    }

    function updateTonButton(orderId, tonAmount) {
        const tonButton = document.getElementById("ton-pay-btn");
        if (!tonButton) return;

        if (tonConnectUI.wallet) {
            tonButton.innerText = "Pay with Ton";
            tonButton.onclick = () => sendTransaction(tonConnectUI, orderId, tonAmount);
        } else {
            tonButton.innerText = "Connect Wallet";
            tonButton.onclick = async () => await tonConnectUI.openModal();
        }
    }

    function showOrderModal(orderId, username, amount, price, tonAmount) {
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
                <p><strong>Order ID:</strong> ${orderId}</p>
                <p><strong>Username:</strong> ${username}</p>
                <p><strong>Amount:</strong> ${amount} Stars</p>
                <p><strong>Price:</strong> $${price}</p>
                <p><strong>TON Amount:</strong> ${tonAmount} TON</p>

                <button id="ton-pay-btn" data-order-id="${orderId}" style="
                    background-color: #007bff; color: white; border: none; padding: 10px 15px;
                    font-size: 14px; border-radius: 5px; cursor: pointer; margin: 5px;
                ">🔗 Connect Wallet</button>

                <button onclick="document.getElementById('order-modal-overlay').remove()" style="
                    background-color: #dc3545; color: white; border: none; padding: 10px 15px;
                    font-size: 14px; border-radius: 5px; cursor: pointer; margin-top: 20px;
                ">❌ Cancel</button>
            </div>
        </div>`;

        document.body.insertAdjacentHTML("beforeend", modalHTML);
        updateTonButton(orderId, tonAmount);
    }

    document.getElementById("orderButton").addEventListener("click", function () {
        const orderId = `${Date.now()}-${Math.random().toString(36).substr(2, 10)}`;
        const username = usernameInput.value.trim() || "Unknown";
        const amount = orderButton.getAttribute("data-amount") || 100;
        const price = orderButton.getAttribute("data-price") || 5;

        fetchTonPrice().then(tonPrice => {
            const tonAmount = (price / tonPrice).toFixed(2);
            showOrderModal(orderId, username, amount, price, tonAmount);
        });
    });
});
