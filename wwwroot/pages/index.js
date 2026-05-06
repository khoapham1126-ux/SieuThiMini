let revenueChart = null;

document.addEventListener("DOMContentLoaded", async () => {
    await loadDashboardStats();
    await loadDashboardCharts();
    renderUserInfo();
});

async function loadDashboardStats() {
    try {
        const res = await fetch("/api/Dashboard/summary");
        if (!res.ok) throw new Error("Không tải được dashboard summary");

        const data = await res.json();

        document.getElementById("totalEmployees").textContent = data.totalEmployees;
        document.getElementById("totalCustomers").textContent = data.totalCustomers;
        document.getElementById("totalProducts").textContent = data.totalProducts;
        document.getElementById("totalWarnings").textContent = data.totalWarnings;

        document.getElementById("todayRevenue").textContent = formatCurrency(data.todayRevenue);
        document.getElementById("monthRevenue").textContent = formatCurrency(data.monthRevenue);
        document.getElementById("todayOrders").textContent = data.todayOrders;
        document.getElementById("pendingOrders").textContent = data.pendingOrders;

    } catch (error) {
        console.error("Lỗi load dashboard:", error);
    }
}

async function loadDashboardCharts() {
    try {
        const [revenueRes, topProductsRes] = await Promise.all([
            fetch("/api/Dashboard/revenue-7days"),
            fetch("/api/Dashboard/top-products")
        ]);

        const revenueData = revenueRes.ok ? await revenueRes.json() : [];
        const topProducts = topProductsRes.ok ? await topProductsRes.json() : [];

        renderRevenueChart(revenueData);
        renderTopProducts(topProducts);

    } catch (error) {
        console.error("Lỗi load chart:", error);
    }
}

function renderRevenueChart(data) {
    const ctx = document.getElementById("revenueChart");
    if (!ctx) return;

    const labels = data.map(x => new Date(x.date).toLocaleDateString("vi-VN"));
    const values = data.map(x => x.revenue);

    if (revenueChart) {
        revenueChart.destroy();
    }

    revenueChart = new Chart(ctx, {
        type: "line",
        data: {
            labels,
            datasets: [{
                label: "Doanh thu",
                data: values,
                borderColor: "#dc2626",
                backgroundColor: "rgba(220,38,38,0.1)",
                tension: 0.35,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function renderTopProducts(data) {
    const container = document.getElementById("topProductsList");
    if (!container) return;

    if (!data || data.length === 0) {
        container.innerHTML = `<div class="text-muted">Chưa có dữ liệu</div>`;
        return;
    }

    container.innerHTML = data.map((item, index) => `
        <div class="d-flex justify-content-between align-items-center border-bottom py-2">
            <div>
                <div class="fw-semibold">${index + 1}. ${item.tenSanPham || "N/A"}</div>
                <div class="small text-muted">Bán: ${item.soLuongBan} sản phẩm</div>
            </div>
            <div class="text-end">
                <div class="fw-bold text-danger">${formatCurrency(item.doanhThu)}</div>
            </div>
        </div>
    `).join("");
}

function formatCurrency(amount) {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount || 0);
}