// script.js

// JavaScript function to handle the redirection
function redirectToBuyStar() {
    window.location.href = 'buystar.html';
}

// Function to dynamically load header and footer
document.addEventListener("DOMContentLoaded", function() {
    // Load header and footer from external files
    loadContent('header.html', 'header-container');
    loadContent('footer.html', 'footer-container');
});

// Function to fetch and inject content from an external file into a specified container
function loadContent(file, containerId) {
    fetch(file)
        .then(response => response.text())
        .then(data => {
            document.getElementById(containerId).innerHTML = data;
        })
        .catch(error => {
            console.error('Error loading file:', error);
        });
}
// script.js
const starsPackages = [
    { amount: 50, price: 0.85 },
    { amount: 75, price: 1.275 },
    { amount: 100, price: 1.7 },
    { amount: 150, price: 2.55 },
    { amount: 250, price: 4.25 }
];

const pricePerStar = 0.017; // Giá trung bình ước tính mỗi sao

const starList = document.getElementById("starList");

starsPackages.forEach(pkg => {
    const item = document.createElement("div");
    item.className = "star-item";
    item.innerHTML = `
        <span>${pkg.amount} sao - $${pkg.price.toFixed(2)}</span>
        <button onclick="buyStars(${pkg.amount}, ${pkg.price})">Mua ngay</button>
    `;
    starList.appendChild(item);
});

function buyStars(amount, price) {
    alert(`Bạn đã chọn mua ${amount} sao với giá $${price.toFixed(2)}`);
    // Gọi API thanh toán tại đây
}

function calculateCustomPrice() {
    let customAmount = document.getElementById("customAmount").value;
    if (customAmount < 1) {
        document.getElementById("customPrice").innerText = "Số lượng sao không hợp lệ";
        return;
    }
    let customPrice = customAmount * pricePerStar;
    document.getElementById("customPrice").innerText = `Giá ước tính: $${customPrice.toFixed(2)}`;
}
