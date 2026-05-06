let reportChart = null;

document.addEventListener("DOMContentLoaded", async () => {
    await loadReport();
    renderUserInfo();
});

async function loadReport() {
    try {
        const [overviewRes, dailyRes, topProductsRes] = await Promise.all([
            fetch("/api/BaoCao/overview"),
            fetch("/api/BaoCao/daily"),
            fetch("/api/BaoCao/top-products")
        ]);

        const overview = overviewRes.ok ? await overviewRes.json() : null;
        const daily = dailyRes.ok ? await dailyRes.json() : [];
        const topProducts = topProductsRes.ok ? await topProductsRes.json() : [];

        if (overview) {
            document.getElementById("reportRevenue").textContent = formatCurrency(overview.revenue);
            document.getElementById("reportOrders").textContent = overview.totalOrders;
            document.getElementById("reportPaid").textContent = overview.totalPaid;
            document.getElementById("reportCancelled").textContent = overview.totalCancelled;
        }

        renderChart(daily);
        renderTopProducts(topProducts);

    } catch (error) {
        console.error("Lỗi load báo cáo:", error);
    }
}

function renderChart(data) {
    const ctx = document.getElementById("reportChart");
    if (!ctx) return;

    const labels = data.map(x => new Date(x.date).toLocaleDateString("vi-VN"));
    const values = data.map(x => x.revenue);

    if (reportChart) reportChart.destroy();

    reportChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Doanh thu",
                data: values,
                backgroundColor: "#dc2626"
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function renderTopProducts(data) {
    const container = document.getElementById("reportTopProducts");
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
            <div class="fw-bold text-danger">${formatCurrency(item.doanhThu)}</div>
        </div>
    `).join("");
}

function formatCurrency(amount) {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount || 0);
}