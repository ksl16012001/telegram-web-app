document.addEventListener("DOMContentLoaded", function () {
    Telegram.WebApp.ready();

    let userInfoBox = document.getElementById("user-info");
    let usernameInput = document.getElementById("username-input");
    let orderButton = document.getElementById("orderButton");

    // 🛠️ Hiển thị thông tin người dùng Telegram
    function updateUserInfo(user) {
        if (user) {
            userInfoBox.innerHTML = `
                <div class="user-info">
                    <img src="${user.photo_url || 'src/imgs/default_avatar.png'}" alt="User Avatar">
                    <div class="user-details">
                        <p>${user.first_name} (@${user.username || 'No username'})</p>
                        <p id="phone-status">📞 Fetching phone number...</p>
                    </div>
                </div>
            `;
            usernameInput.value = user.username || "";
            requestPhoneNumber();
        } else {
            userInfoBox.innerHTML = "<p>Unable to fetch user data!</p>";
        }
    }

    // 🛠️ Lấy số điện thoại từ Telegram WebApp
    function requestPhoneNumber() {
        Telegram.WebApp.requestContact(function (sent, event) {
            let phoneStatus = document.getElementById("phone-status");
            if (sent) {
                let phoneNumber = event?.responseUnsafe?.contact?.phone_number || "Not available";
                phoneStatus.innerHTML = `📞 +${phoneNumber}`;
                phoneStatus.className = "ok";
            } else {
                phoneStatus.innerHTML = "🚫 User denied sharing phone number";
                phoneStatus.className = "err";
            }
        });
    }

    // 🛠️ Danh sách gói sao & giá tiền
    const starsPackages = [
        { amount: 100, price: 1.7 }, { amount: 150, price: 2.55 }, { amount: 250, price: 4.25 },
        { amount: 350, price: 5.95 }, { amount: 500, price: 8.5 }, { amount: 750, price: 12.75 },
        { amount: 1000, price: 16.5 }, { amount: 1500, price: 25 }, { amount: 2500, price: 42 }
    ];

    const starList = document.getElementById("starList");
    const selectedPackageDiv = document.getElementById("selectedPackage");
    const selectedAmount = document.getElementById("selectedAmount");
    const selectedPrice = document.getElementById("selectedPrice");

    // 🔹 Hiển thị danh sách gói sao
    function formatAmount(amount) {
        if (amount >= 1000000) return (amount / 1000000) + 'M';
        if (amount >= 1000) return (amount / 1000) + 'K';
        return amount.toString();
    }

    starsPackages.forEach((pkg, index) => {
        const item = document.createElement("div");
        item.className = "star-item";
        item.innerHTML = `${formatAmount(pkg.amount)} ⭐`;

        item.onclick = function () {
            selectStarPackage(index, pkg.amount, pkg.price);
        };

        starList.appendChild(item);
    });

    // 🔹 Chọn gói sao
    function selectStarPackage(index, amount, price) {
        document.querySelectorAll('.star-item').forEach(item => item.classList.remove('selected'));
        document.querySelectorAll('.star-item')[index].classList.add('selected');

        // Hiển thị gói đã chọn
        selectedPackageDiv.style.display = 'block';
        selectedAmount.textContent = `Number of stars: ${formatAmount(amount)}`;
        selectedPrice.textContent = `Price: $${price.toFixed(2)}`;
        
        // Cập nhật nội dung nút
        orderButton.innerText = `Order ${amount} Stars`;
        orderButton.setAttribute("data-amount", amount);
        orderButton.setAttribute("data-price", price);
    }

    // 🔹 Lấy tỷ giá TON/USD
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

    // 🛠️ Xử lý thanh toán
    async function buyStars() {
        const amount = orderButton.getAttribute("data-amount");
        const price = orderButton.getAttribute("data-price");
        const username = usernameInput.value || "Unknown";

        if (!amount || !price) {
            alert("Please select a star package first!");
            return;
        }

        const tonPriceInUsd = await fetchTonPrice();
        if (!tonPriceInUsd) {
            alert("Failed to fetch TON price. Please try again later.");
            return;
        }

        // Chuyển đổi từ USD sang TON
        const tonPrice = (price / tonPriceInUsd + 0.01).toFixed(2);

        // Tạo link thanh toán TON Keeper
        const paymentLink = `https://app.tonkeeper.com/transfer/UQDUIxkuAb8xjWpRQVyxGse3L3zN6dbmgUG1OK2M0EQdkxDg?amount=${tonPrice * 1000000000}&text=${username}`;

        // Chuyển hướng đến link thanh toán
        window.open(paymentLink, "_blank");
    }

    // 🛠️ Lấy thông tin Telegram user
    updateUserInfo(Telegram.WebApp.initDataUnsafe?.user || null);
});
