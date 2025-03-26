document.addEventListener("DOMContentLoaded", async function () {
    Telegram.WebApp.ready();

    let user = Telegram.WebApp.initDataUnsafe?.user || null;
    let userCard = document.getElementById("usercard");
    let walletStatus = document.getElementById("walletStatus");
    let connectButton = document.getElementById("connectWalletButton");
    let userId = user?.id || "null";
    let orderList = document.getElementById("order-list");
    let reloadButton = document.getElementById("reloadOrders");
    // 🔹 Xử lý sự kiện click nút Reload
    reloadButton.addEventListener("click", async function () {
        console.log("🔄 Reloading orders...");
        reloadButton.innerText = "⏳ Reloading...";
        await fetchUserOrders(userId);
        reloadButton.innerText = "🔄 Reload Orders";
    });
    // 🔹 Hàm tải danh sách đơn hàng
    async function fetchUserOrders(userId) {
        try {
            const response = await fetch(`/api/user-orders/${userId}`);
            const data = await response.json();

            if (!data.success || !data.orders.length) {
                orderList.innerHTML = "<p>No orders found.</p>";
                return;
            }

            displayOrders(data.orders);
        } catch (error) {
            console.error("❌ Error fetching orders:", error);
            orderList.innerHTML = "<p>Error loading orders.</p>";
        }
    }

    // 🔹 Hiển thị danh sách đơn hàng
    function displayOrders(orders) {
        orderList.innerHTML = "";
        orders.forEach(order => {
            let amountDisplay = order.service == "Buy Star" ? `Stars` : `Months`;
            let orderItem = document.createElement("div");
            orderItem.classList.add("order-item");
            orderItem.innerHTML = `
    <div class="info-box">
        <strong>${order.service}</strong> - ${order.packageAmount} ${amountDisplay}
        <br> Status: <span style="color: ${order.status === 'pending' ? 'orange' : (order.status === 'paid'&&'complete' ? 'green' : 'red')}">
            ${order.status.toUpperCase()}
        </span>
    </div>
`;
            // 🔥 Thêm sự kiện click bằng `addEventListener`
            orderItem.addEventListener("click", function () {
                showOrderDetails(order.orderId, order.service, order.packageAmount, order.packagePrice, order.tonAmount, order.status, order.paymentLink);
            });

            orderList.appendChild(orderItem);
        });
    }

    // 🔹 Hiển thị modal chi tiết đơn hàng
    function showOrderDetails(orderId, service, amount, price, tonAmount, status, paymentLink) {
        console.log("📌 Opening order details:", orderId); // Debug log
    
        // 🔹 Xác định loại dịch vụ để hiển thị số lượng phù hợp
        const amountDisplay = service == "Buy Star" ? `${amount} Stars` : `${amount} Months`;
    
        // 🔹 Tạo modal
        const modalOverlay = document.createElement("div");
        modalOverlay.id = "order-modal-overlay";
        modalOverlay.style.position = "fixed";
        modalOverlay.style.top = "0";
        modalOverlay.style.left = "0";
        modalOverlay.style.width = "100%";
        modalOverlay.style.height = "100%";
        modalOverlay.style.background = "rgba(0, 0, 0, 0.5)";
        modalOverlay.style.display = "flex";
        modalOverlay.style.alignItems = "center";
        modalOverlay.style.justifyContent = "center";
        modalOverlay.style.zIndex = "1000";
    
        modalOverlay.innerHTML = `
    <div id="order-modal" style="
        background: black; padding: 20px; border-radius: 10px; width: 350px;
        text-align: center; box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);">
        <h2>Order Details</h2>
        <p><strong>Service:</strong> ${service}</p>
        <p><strong>Amount:</strong> ${amountDisplay}</p>
        <p><strong>Price:</strong> $${price}</p>
        <p><strong>TON Amount:</strong> ${tonAmount} TON</p>
        <p><strong>Status:</strong> <span style="color: ${status === 'pending' ? 'orange' : (status === 'paid' ? 'green' : 'red')}">${status.toUpperCase()}</span></p>
    
        <div id="modal-buttons" style="margin-top: 15px;">
            <button id="closeModalButton" style="background: #007bff; color: white; padding: 10px 15px; border: none; border-radius: 5px; cursor: pointer;">Close</button>
        </div>
    </div>
    `;
    
        // Xóa modal cũ nếu có
        const existingModal = document.getElementById("order-modal-overlay");
        if (existingModal) {
            existingModal.remove();
        }
    
        // 🔹 Thêm modal vào DOM
        document.body.appendChild(modalOverlay);
    
        // 🔥 Gán sự kiện sau khi modal đã được thêm vào DOM
        if (status === "pending") {
            document.getElementById("payNowButton").addEventListener("click", () => payNow(paymentLink));
            document.getElementById("cancelOrderButton").addEventListener("click", () => cancelOrder(orderId));
        }
        document.getElementById("closeModalButton").addEventListener("click", closeModal);
    }
    

    function payNow(paymentLink) {
        window.open(paymentLink, "_blank");
    }

    // 🔹 Hủy đơn hàng
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
                }).then(() => {
                    // 🔹 Đóng modal chi tiết đơn hàng nếu đang mở
                    closeModal();
    
                    // 🔹 Cập nhật lại danh sách đơn hàng để hiển thị trạng thái mới
                    fetchUserOrders(userId);
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

    // 🔹 Đóng modal
    function closeModal() {
        document.getElementById("order-modal-overlay").remove();
    }

    // ✅ Gọi API để tải danh sách đơn hàng khi trang load
    if (userId !== "null") {
        fetchUserOrders(userId);
    } else {
        orderList.innerHTML = "<p>❌ Please login to see orders</p>";
    }
    async function fetchUserData(userId) {
        try {
            const response = await fetch(`/api/getuser?id=${encodeURIComponent(userId)}`);
            const data = await response.json();

            return data.user || null;
        } catch (error) {
            console.error("❌ Error fetching user data:", error);
            return null;
        }
    }

    function updateUserInfo(user) {
        if (user) {
            userCard.innerHTML = `
                <div class="avatar">
                    <img src="${user.pic || 'src/imgs/default_avatar.png'}" alt="User Avatar">
                </div>
                <div class="username">${user.name}</div>
                <div class="info-box"><span>User ID:</span> <span>${user.id}</span></div>
                <div class="info-box"><span>Username:</span> <span>@${user.username || "Not Set"}</span></div>
                <div class="info-box"><span>Phone:</span> <span>+ ${user.phone || "Not Shared"}</span></div>
                <div class="info-box"><span>Coins:</span> <span>${user.coins || 0} 🟡</span></div>
            `;
        } else {
            userCard.innerHTML = "<p>❌ Unable to fetch user data!</p>";
        }
    }

    if (user) {
        let userData = await fetchUserData(user.id);
        updateUserInfo(userData);
    }

    const tonConnect = new TONConnect.TonConnect();

    async function connectWallet() {
        try {
            const walletsList = await tonConnect.getWallets();
            if (walletsList.length === 0) return alert("No TON wallets available!");

            await tonConnect.connect(walletsList[0]);
            const account = await tonConnect.getWalletInfo();
            walletStatus.textContent = `${account.address}`;
            connectButton.textContent = "Disconnect Wallet";
        } catch {
            alert("Unable to connect wallet. Try again.");
        }
    }

    async function disconnectWallet() {
        await tonConnect.disconnect();
        walletStatus.textContent = "Not Connected";
        connectButton.textContent = "Connect Wallet";
    }

    connectButton.addEventListener("click", () => {
        connectButton.textContent === "Disconnect Wallet" ? disconnectWallet() : connectWallet();
    });
});