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
            <td>
                ${order.status === "paid" ? `
                    <button onclick="window.open('https://tonscan.org/tx/${order.transactionId}', '_blank')" class="pay">✅ Check Transaction</button>
                    <button class="pay" onclick="completeOrder('${order.orderId}')">✅ Mark Completed</button>
                    <button class="go-to-fragment" onclick="goToFragment('${order.username}', '${order.packageAmount}')">➡️ Go to Fragment</button>
                ` : `<button class="go-to-fragment" onclick="goToFragment('${order.username}', '${order.packageAmount}')">➡️ Go to Fragment</button>`}
            </td>
        `;
        ordersTable.appendChild(row);
    });
}
function goToFragment(username, quantity) {
    recipient=getRecipient(username)
    // Tạo URL từ recipient và quantity
    const url = `https://fragment.com/stars/buy?recipient=${encodeURIComponent(recipient)}&quantity=${encodeURIComponent(quantity)}`;
    
    // Mở URL trong tab mới
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

document.addEventListener("DOMContentLoaded", fetchConfig);
async function fetchAdminData() {
    // const token = localStorage.getItem("adminToken");
    // if (!token) {
    //     window.location.href = "/admin/login.html";
    //     return;
    // }

    const response = await fetch("/api/admin/orders", {
        headers: { Authorization: `Bearer ${token}` }
    });

    if (response.status === 403) {
        alert("❌ Unauthorized access");
        localStorage.removeItem("adminToken");
        window.location.href = "/admin/login.html";
        return;
    }

    const data = await response.json();
    console.log("Admin Orders:", data);
}

fetchAdminData();
// Hàm gửi yêu cầu lấy thông tin recipient từ username
async function getRecipient(username) {
    // Định nghĩa headers
    const headers = {
        'Content-Length': '57',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Sec-Ch-Ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Sec-Ch-Ua-Mobile': '?0',
        'Origin': 'https://fragment.com',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Dest': 'empty',
        'Referer': 'https://fragment.com/stars/buy?quantity=100',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Accept-Language': 'vi,fr-FR;q=0.9,fr;q=0.8,en-US;q=0.7,en;q=0.6,zh-TW;q=0.5,zh;q=0.4',
        'Priority': 'u=1, i',
        'Cookie': 'stel_ssid=5ac98476080a251d19_5036652558238127629; stel_dt=-420; stel_token=050eb84032063dce62c146a8a9496a63050eb85a050eb68b5a8d4ad9404b60900ec86; stel_ton_token=f0eB8_DfJStfHXF1N5iyx0LMBDUwix25jfg-3Jo5a-AWGnQxuyFwKF56CJLz84I7eTEddyhikJIofDSoclWtPTweMkfVGveaab4KkbqzSstnCaOTbFFCqfG-nJZFaBnq57xpZPyWlXzQAUqmjFLaTZVVh9A0NNxi5-hpMjrH1oSJn0zbQ9bxMKw6A_UnZzVQlehLhruw'
    };

    // Dữ liệu payload chưa mã hóa (raw data)
    const payload = new URLSearchParams();
    payload.append('query', username);  // Sử dụng username làm giá trị cho query
    payload.append('quantity', '100');
    payload.append('method', 'searchStarsRecipient');

    try {
        // Gửi yêu cầu POST
        const response = await fetch('https://fragment.com/api?hash=e006bcba00888acbf2', {
            method: 'POST',
            headers: headers,
            body: payload.toString()
        });

        // Kiểm tra mã trạng thái và trả về thông tin recipient
        if (response.ok) {
            const data = await response.json();  // Giải mã phản hồi JSON
            if (data.ok) {
                const recipient = data.found ? data.found.recipient : null;
                return recipient ? recipient : 'Không tìm thấy recipient cho username này.';
            } else {
                return 'Không tìm thấy recipient cho username này.';
            }
        } else {
            return `Lỗi khi gửi yêu cầu. Mã lỗi: ${response.status}`;
        }
    } catch (error) {
        return `Lỗi khi gửi yêu cầu: ${error.message}`;
    }
}

// Ví dụ sử dụng hàm với username
const username = 'kinkin1601';
getRecipient(username).then(recipient => {
    console.log('Recipient:', recipient);
});
