// JavaScript function to handle the redirection
function redirectToBuyStar() {
    // Redirect to the buystar.html page
    window.location.href = 'buystar.html';
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
    <a href="/games.html">
        <div>Games</div>
    </a>
    <a href="/home.html">
        <div>Home</div>
    </a>
    <a href="/profile.html">
        <div>Profile</div>
    </a>
</div>
`;
