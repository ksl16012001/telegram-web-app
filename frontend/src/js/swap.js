const STAR_TO_USD_RATE = 7 / 1000;
let tonRate = ""; 
const bottomMenu = document.createElement("div");
bottomMenu.className = "bottom-menu";
bottomMenu.innerHTML = `
    <button onclick="location.href='index.html'">Home</button>
    <button onclick="location.href='swapstar.html'">Swap Star</button>
    <button onclick="location.href='buystar.html'">Buy Stars</button>
    <button onclick="location.href='buypre.html'">Buy Premium</button>
    <button onclick="location.href='profile.html'">Profile</button>
`;
document.body.appendChild(bottomMenu);
async function fetchTonRate() {
    try {
        let response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd");
        let data = await response.json();
        tonRate = data["the-open-network"].usd;
        if (!tonRate) throw new Error("Tỷ giá TON/USD không hợp lệ!");
        // console.log("✅ Tỷ giá TON/USD:", tonRate);
    } catch (error) {
        console.error("❌ Lỗi khi lấy tỷ giá TON:", error);
        tonRate = 3.5; 
    }
}
function selectStars(button, amount) {
    if (!tonRate || tonRate <= 0) {
        alert("⚠️ Không thể tính tỷ giá, vui lòng thử lại sau!");
        return;
    }
    let usdValue = amount * STAR_TO_USD_RATE; 
    let tonAmount = usdValue / tonRate; 
    document.getElementById("tonAmount").innerText = tonAmount.toFixed(6) + " TON";
    document.querySelectorAll('.star-option').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    document.getElementById("selectedAmount").value = amount;
}
// Main function to swap Stars
async function swapNow() {
    // Check Telegram WebApp
    if (!Telegram.WebApp.initDataUnsafe?.user?.id) {
        Swal.fire({
            icon: "warning",
            title: "⚠️ Telegram Error",
            text: "Unable to identify Telegram account. Please reopen the WebApp!",
        });
        return;
    }

    const userId = Telegram.WebApp.initDataUnsafe.user.id;
    const selectedAmountInput = document.getElementById("selectedAmount")?.value;
    const selectedAmount = parseFloat(selectedAmountInput);
    if (isNaN(selectedAmount) || selectedAmount <= 0) {
        Swal.fire({
            icon: "warning",
            title: "⚠️ Invalid Amount",
            text: "Please enter a valid Stars amount (greater than 0)!",
        });
        return;
    }
    try {
        Swal.fire({
            title: "Creating Invoice...",
            text: "Please wait a moment.",
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
        });
        const response = await fetchWithTimeout("api/create-invoice", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, amount: selectedAmount }),
        });

        if (!response.ok) {
            throw new Error(`Server returned an error: ${response.status}`);
        }

        const data = await response.json();
        if (!data.success || !data.invoice?.link) {
            throw new Error(data.message || "Failed to create invoice!");
        }

        // Close loading notification and open invoice
        Swal.close();
        Telegram.WebApp.openTelegramLink(data.invoice.link);

    } catch (error) {
        console.error("❌ Error during swap:", error);
        Swal.fire({
            icon: "error",
            title: "❌ Error",
            text: error.message || "An error occurred, please try again later!",
            showConfirmButton: true,
            confirmButtonText: "Try Again",
        }).then((result) => {
            if (result.isConfirmed) swapNow(); // Allow retry
        });
    }
}
Telegram.WebApp.onEvent("invoiceClosed", (result) => {
    switch (result.status) {
        case "paid":
            Swal.fire({
                icon: "success",
                title: "🎉 Payment Successful",
                text: "Stars have been added to your account!",
            });
            break;
        case "cancelled":
            Swal.fire({
                icon: "warning",
                title: "⚠️ Cancelled",
                text: "You have cancelled the payment.",
            });
            break;
        case "pending":
            Swal.fire({
                icon: "info",
                title: "⏳ Pending",
                text: "Payment is being processed, please check back later.",
            });
            break;
        case "failed":
            Swal.fire({
                icon: "error",
                title: "❌ Failed",
                text: "Payment failed, please try again.",
            });
            break;
        default:
            Swal.fire({
                icon: "error",
                title: "❌ Unknown Error",
                text: "An unexpected error occurred.",
            });
    }
});
function fetchWithTimeout(url, options = {}, timeout = 10000) {
    return Promise.race([
        fetch(url, options),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Request timed out")), timeout)
        ),
    ]);
}
fetchTonRate();
