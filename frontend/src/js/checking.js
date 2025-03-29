(async function () {
    if (!window.Telegram || !Telegram.WebApp) {
        console.error("❌ Telegram WebApp is not available.");
        return;
    }
    Telegram.WebApp.ready();
    let user = Telegram.WebApp.initDataUnsafe?.user || null;
    let userId = user?.id || "null";
    let checkingInterval = null;
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
    async function autoCheckPendingOrders() {
        if (!userId || userId === "null") return;
        console.log("🔄 Checking all pending orders...");
        const orders = await fetchUserOrders(userId);
        const pendingOrders = orders.filter(order => order.status === "pending");

        if (pendingOrders.length === 0) {
            console.log("✅ No pending orders left, stopping transaction check.");
            clearInterval(checkingInterval); 
            checkingInterval = null;
            return;
        }
        for (const order of pendingOrders) {
            await checkTransaction(order.orderId);
        }
    }
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
                fetchUserOrders(userId);
            }
        } catch (error) {
            console.error("❌ Error checking transaction:", error);
        }
    }
    async function startAutoChecking() {
        if (checkingInterval) return; 
        console.log("🚀 Starting auto transaction check...");
        checkingInterval = setInterval(autoCheckPendingOrders, 30000); 
    }
    if (userId !== "null") {
        fetchUserOrders(userId).then(orders => {
            const hasPendingOrders = orders.some(order => order.status === "pending");
            if (hasPendingOrders) {
                startAutoChecking(); 
            }
        });
    }
})();
