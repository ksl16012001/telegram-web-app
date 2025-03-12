// JavaScript function to handle the redirection
function redirectToBuyStar() {
    // Redirect to the buystar.html page
    window.location.href = 'buystar.html';
}
function redirectToProfile() {
    // Redirect to the buystar.html page
    window.location.href = 'profile.html';
}
// Dynamically load header and footer
document.getElementById('header').innerHTML = `
    <div class="header">
        <img src="src/imgs/cash-bag.gif" alt="logo" class="logo">
        <h1>HuluPay</h1>
        <div class="shopping-time">
            <img src="src/imgs/shopping.gif" alt="gif" class="shopping-gif">
        </div>
    </div>
`;

document.getElementById('footer').innerHTML = `
    <div class="footer">
    <a href="javascript:history.back()">
        <div>Back</div>
    </a>
    <a href="game.html">
        <div>Games</div>
    </a>
    <a href="index.html">
        <div>Home</div>
    </a>
    <a href="profile.html">
        <div>Profile</div>
    </a>
</div>
`;
document.addEventListener("DOMContentLoaded", function () {
    let tg = window.Telegram.WebApp;
    tg.expand(); // Mở rộng WebApp toàn màn hình

    let user = tg.initDataUnsafe.user;
    
    if (user) {
        localStorage.setItem("tg_username", user.username ? `@${user.username}` : "");

        document.getElementById("user-info").innerHTML = `
            <p><b>ID:</b> ${user.id}</p>
            <p><b>First Name:</b> ${user.first_name}</p>
            <p><b>Last Name:</b> ${user.last_name || "N/A"}</p>
            <p><b>Username:</b> @${user.username || "N/A"}</p>
        `;
    }
});
