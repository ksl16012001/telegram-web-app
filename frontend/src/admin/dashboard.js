document.addEventListener("DOMContentLoaded", function () {
    const tabs = document.querySelectorAll(".tab-btn");
    const contents = document.querySelectorAll(".tab-content");

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
            <td>
                ${order.status === "pending" ? `
                    <a href="https://tonscan.org/tx/${order.transactionId}"><button class="pay" onclick="markAsCompleted('${order.orderId}')">✅ Check Transaction</button></a>
                    <button class="pay" onclick="markAsCompleted('${order.orderId}')">✅ Mark Paid</button>
                    <button class="cancel" onclick="cancelOrder('${order.orderId}')">❌ Cancel</button>
                ` : ""}
            </td>
        `;
        ordersTable.appendChild(row);
    });
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

document.addEventListener("DOMContentLoaded", fetchConfig);
