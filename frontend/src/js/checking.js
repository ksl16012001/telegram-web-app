(async function () {
    // 🔹 Kiểm tra Telegram WebApp đã sẵn sàng chưa
    if (!window.Telegram || !Telegram.WebApp) {
        console.error("❌ Telegram WebApp is not available.");
        return;
    }

    Telegram.WebApp.ready();
    let user = Telegram.WebApp.initDataUnsafe?.user || null;
    let userId = user?.id || "null";
    let checkingInterval = null; // 🔹 Biến kiểm soát quá trình kiểm tra

    // 🔹 Hàm tải danh sách đơn hàng
    async function fetchUserOrders(userId) {
        try {
            const response = await fetch(`/api/user-orders/${userId}`);
            const data = await response.json();

            if (!data.success || !data.orders.length) {
                console.log("⚠️ No orders found.");
                return [];
            }

            return data.orders;
        } catch (error) {
            console.error("❌ Error fetching orders:", error);
            return [];
        }
    }

    // 🔹 Kiểm tra giao dịch của tất cả đơn hàng "pending"
    async function autoCheckPendingOrders() {
        if (!userId || userId === "null") return;

        console.log("🔄 Checking all pending orders...");

        // 🔹 Lấy danh sách đơn hàng mới nhất
        const orders = await fetchUserOrders(userId);
        const pendingOrders = orders.filter(order => order.status === "pending");

        if (pendingOrders.length === 0) {
            console.log("✅ No pending orders left, stopping transaction check.");
            clearInterval(checkingInterval); // Dừng kiểm tra
            checkingInterval = null;
            return;
        }

        // 🔹 Kiểm tra từng order "pending"
        for (const order of pendingOrders) {
            await checkTransaction(order.orderId);
        }
    }

    // 🔹 Gọi API kiểm tra giao dịch của từng order
    async function checkTransaction(orderId) {
        try {
            const response = await fetch("/api/check-transaction", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId })
            });
            const result = await response.json();

            if (result.success) {
                console.log(`✅ Order ${orderId} has been marked as PAID.`);
                Swal.fire({
                    icon: "success",
                    title: "✅ Payment Received!",
                    text: `Your order ${orderId} has been paid.`,
                    confirmButtonColor: "#28a745"
                });

                // Cập nhật lại danh sách đơn hàng
                fetchUserOrders(userId);
            }
        } catch (error) {
            console.error("❌ Error checking transaction:", error);
        }
    }

    // 🔹 Bắt đầu kiểm tra tự động khi có đơn hàng "pending"
    async function startAutoChecking() {
        if (checkingInterval) return; // Nếu đã chạy thì không khởi động lại

        console.log("🚀 Starting auto transaction check...");
        checkingInterval = setInterval(autoCheckPendingOrders, 30000); // 🔹 Kiểm tra mỗi 10 giây
    }

    // ✅ Gọi API để tải danh sách đơn hàng khi trang load
    if (userId !== "null") {
        fetchUserOrders(userId).then(orders => {
            const hasPendingOrders = orders.some(order => order.status === "pending");
            if (hasPendingOrders) {
                startAutoChecking(); // 🔹 Bắt đầu kiểm tra tự động nếu có đơn "pending"
            }
        });
    }
})();
