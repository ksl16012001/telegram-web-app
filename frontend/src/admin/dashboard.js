document.addEventListener("DOMContentLoaded", async function () {
    const tabs = document.querySelectorAll(".tab-btn");
    const contents = document.querySelectorAll(".tab-content");
    Telegram.WebApp.ready();
    let user = Telegram.WebApp.initDataUnsafe?.user || null;
    let userId = user?.id || null;
    try {
        let response = await fetch("/api/admin-chat-id");
        let data = await response.json();
        let adminChatId = data.adminChatId;
        if (userId !== parseInt(adminChatId)) {
            document.body.innerHTML = `
                <div style="text-align:center; padding:50px;">
                    <h2>🚫 Access Denied</h2>
                </div>
            `;
            return;
        }
    } catch (error) {
        console.error("Err", error);
        // alert("Error", error);
        return;
    }
    Telegram.WebApp.requestFullscreen()
    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            tabs.forEach(btn => btn.classList.remove("active"));
            tab.classList.add("active");
            contents.forEach(content => content.classList.remove("active"));
            document.getElementById(tab.dataset.tab).classList.add("active");
        });
    });
    fetchOrders();
    fetchUsers();
    document.getElementById("orderFilter").addEventListener("change", fetchOrders);
});
async function markAsCompleted(orderId) {
    try {
        const response = await fetch("/api/complete-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId })
        });
        const result = await response.json();
        if (result.success) {
            Swal.fire({
                icon: "success",
                title: "✅ Order Completed!",
                text: `Order ${orderId} has been marked as completed.`,
                confirmButtonColor: "#28a745"
            });
        } else {
            Swal.fire({
                icon: "error",
                title: "❌ Failed to Complete Order",
                text: result.message,
                confirmButtonColor: "#d33"
            });
        }
    } catch (error) {
        console.error("❌ Error updating order status:", error);
        Swal.fire({
            icon: "error",
            title: "❌ Error",
            text: "Error updating order status. Please try again.",
            confirmButtonColor: "#d33"
        });
    }
}
async function fetchOrders() {
    const statusFilter = document.getElementById("orderFilter").value;
    const response = await fetch("/api/admin/orders");
    const { orders } = await response.json();
    const ordersTable = document.getElementById("ordersTable");
    ordersTable.innerHTML = "";
    orders.forEach(order => {
        if (statusFilter !== "all" && order.status !== statusFilter) return;
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${order.orderId}</td>
            <td>${order.username}</td>
            <td>${order.service}</td>
            <td>${order.transactionId}</td>
            <td>${order.tonAmount}</td>
            <td>${order.packageAmount}</td>
            <td>${order.status}</td>
            <td class="action-buttons">
                <div class="icons">
                    <span>✅</span>
                    <span>🔍</span>
                    <span>➡</span>
                </div>
                <div class="details">
                    <button onclick="window.open('https://tonscan.org/tx/${order.transactionId}', '_blank')" class="pay">Check Transaction</button>
                    <button class="pay" onclick="completeOrder('${order.orderId}')">✅ Mark Complete</button>
                    <button class="go-to-fragment" onclick="goToFragment('${order.username}', '${order.packageAmount}')">Go to Fragment</button>
                </div>
            </td>
        `;
        ordersTable.appendChild(row);
    });
}
async function goToFragment(username, quantity) {
    const recipient = await getRecipient(username);
    if (!recipient) {
        alert('Không thể tìm thấy recipient cho username này.');
        return;
    }
    const url = `https://fragment.com/stars/buy?recipient=${encodeURIComponent(recipient)}&quantity=${encodeURIComponent(quantity)}`;
    window.open(url, '_blank');
}
async function fetchUsers() {
    const response = await fetch("/api/admin/users");
    const { users } = await response.json();
    const usersTable = document.getElementById("usersTable");
    usersTable.innerHTML = "";
    users.forEach(user => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.username}</td>
            <td>${user.phone || "N/A"}</td>
            <td><button onclick="deleteUser('${user.id}')">❌ Delete</button></td>
        `;
        usersTable.appendChild(row);
    });
}
async function markAsPaid(orderId) {
    await fetch("/api/admin/order-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId })
    });
    fetchOrders();
}
async function cancelOrder(orderId) {
    await fetch("/api/cancel-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId })
    });
    fetchOrders();
}
async function completeOrder(orderId) {
    await fetch("/api/complete-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId })
    });
    fetchOrders();
}
async function deleteUser(userId) {
    await fetch("/api/admin/delete-user", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
    });
    fetchUsers();
}
async function fetchConfig() {
    const response = await fetch("/api/admin/config");
    const config = await response.json();
    document.getElementById("tonReceiver").value = config.tonReceiver || "";
    document.getElementById("channelId").value = config.channelId || "";
    document.getElementById("adminChatId").value = config.adminChatId || "";
}
async function updateConfig() {
    const tonReceiver = document.getElementById("tonReceiver").value.trim();
    const channelId = document.getElementById("channelId").value.trim();
    const adminChatId = document.getElementById("adminChatId").value.trim();
    const response = await fetch("/api/admin/update-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tonReceiver, channelId, adminChatId })
    });
    const result = await response.json();
    alert(result.message);
}
async function getRecipient(username) {
    try {
        const response = await fetch(`/api/get-recipient?username=${encodeURIComponent(username)}`);
        if (!response.ok) {
            throw new Error('Lỗi khi gửi yêu cầu');
        }
        const data = await response.json();
        if (data && data.recipient) {
            return data.recipient;
        } else {
            throw new Error('Không tìm thấy recipient cho username này.');
        }
    } catch (error) {
        console.error('Lỗi khi gọi API:', error);
        return null;
    }
}