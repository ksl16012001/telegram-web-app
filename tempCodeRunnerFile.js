async function testCreateInvoice() {
    try {
        const response = await fetch("https://telegram-web-app-k4qx.onrender.com/api/create-invoice", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: "123456789", amount: 10 }),
        });
        const data = await response.json();
        console.log("Response:", data);
    } catch (error) {
        console.error("Error:", error);
    }
}
testCreateInvoice();