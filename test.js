async function testTelegramInvoice() {
    try {
        const botToken = "6595441056:AAFqSBrQB7OIBHc-8NqTdJj-_gaiEEqYxeo"; // Thay bằng token thực tế
        const url = `https://api.telegram.org/bot${botToken}/createInvoiceLink`;

        const payload = {
            chat_id: "123456789",
            title: "Swap Stars",
            description: "Swap 10 Stars",
            payload: "test",
            currency: "XTR",
            prices: [{ label: "Stars", amount: 1000 }],
        };

        // Log payload để kiểm tra
        console.log("Payload to Telegram:", JSON.stringify(payload));

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        // Log status và toàn bộ phản hồi
        console.log("Response status:", response.status);
        const data = await response.json();
        console.log("Full response from Telegram:", data);

        if (data.ok) {
            console.log("Invoice link:", data.result);
        } else {
            console.error("Telegram API error:", data.description);
        }
    } catch (error) {
        console.error("Error testing Telegram API:", error.message);
    }
}

testTelegramInvoice();