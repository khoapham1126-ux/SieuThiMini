let reportChart = null;
let currentFilter = "month"; // today | 7days | month | custom

document.addEventListener("DOMContentLoaded", async () => {
    bindFilterEvents();
    setDefaultFilter("month");
    await loadReport();
    renderUserInfo();
});

function bindFilterEvents() {
    document.querySelectorAll(".filter-chip").forEach(btn => {
        btn.addEventListener("click", async () => {
            const filter = btn.dataset.filter;
            setActiveFilter(filter);

            if (filter === "custom") {
                document.getElementById("customRangeBox")?.classList.remove("d-none");
                return;
            }

            document.getElementById("customRangeBox")?.classList.add("d-none");
            applyQuickFilter(filter);
            await loadReport();
        });
    });

    document.getElementById("btnApplyCustom")?.addEventListener("click", async () => {
        currentFilter = "custom";
        setActiveFilter("custom");

        const from = document.getElementById("fromDate")?.value;
        const to = document.getElementById("toDate")?.value;

        if (!from || !to) {
            alert("Vui lòng chọn đủ từ ngày và đến ngày.");
            return;
        }

        updateRangeLabels(from, to, true);
        await loadReport();
    });

    document.getElementById("btnResetFilter")?.addEventListener("click", async () => {
        setDefaultFilter("month");
        await loadReport();
    });
}

function setActiveFilter(filter) {
    currentFilter = filter;
    document.querySelectorAll(".filter-chip").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.filter === filter);
    });
}

function setDefaultFilter(filter) {
    setActiveFilter(filter);
    document.getElementById("customRangeBox")?.classList.add("d-none");

    const { from, to } = getPresetRange(filter);
    if (from) document.getElementById("fromDate").value = from;
    if (to) document.getElementById("toDate").value = to;

    updateRangeLabels(from, to, filter === "custom");
}

function applyQuickFilter(filter) {
    const { from, to } = getPresetRange(filter);
    if (from) document.getElementById("fromDate").value = from;
    if (to) document.getElementById("toDate").value = to;
    updateRangeLabels(from, to, false);
}

function getPresetRange(filter) {
    const today = new Date();
    const end = formatDateForInput(today);
    let startDate = new Date(today);

    if (filter === "today") {
        return { from: end, to: end };
    }

    if (filter === "7days") {
        startDate.setDate(today.getDate() - 6);
        return { from: formatDateForInput(startDate), to: end };
    }

    // default month
    startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    return { from: formatDateForInput(startDate), to: end };
}

function updateRangeLabels(from, to, isCustom) {
    const fromText = from ? formatDateDisplay(from) : "";
    const toText = to ? formatDateDisplay(to) : "";
    const label = isCustom
        ? `Tuỳ chọn: ${fromText} - ${toText}`
        : currentFilter === "today"
            ? `Hôm nay: ${toText}`
            : currentFilter === "7days"
                ? `7 ngày gần đây: ${fromText} - ${toText}`
                : `Tháng này: ${fromText} - ${toText}`;

    const reportRangeLabel = document.getElementById("reportRangeLabel");
    const chartRangeLabel = document.getElementById("chartRangeLabel");

    if (reportRangeLabel) reportRangeLabel.textContent = `Đang xem: ${label}`;
    if (chartRangeLabel) chartRangeLabel.textContent = label;
}

async function loadReport() {
    try {
        const from = document.getElementById("fromDate")?.value || "";
        const to = document.getElementById("toDate")?.value || "";

        const query = new URLSearchParams();
        if (from) query.set("from", from);
        if (to) query.set("to", to);

        const suffix = query.toString() ? `?${query.toString()}` : "";

        const [overviewRes, dailyRes, topProductsRes] = await Promise.all([
            fetch(`/api/BaoCao/overview${suffix}`),
            fetch(`/api/BaoCao/daily${suffix}`),
            fetch(`/api/BaoCao/top-products${suffix}`)
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

        const currentFrom = document.getElementById("fromDate")?.value || "";
        const currentTo = document.getElementById("toDate")?.value || "";
        updateRangeLabels(currentFrom, currentTo, currentFilter === "custom");

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
                backgroundColor: "#dc2626",
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true,
                    position: "top"
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: value => new Intl.NumberFormat("vi-VN").format(value)
                    }
                }
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

function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function formatDateDisplay(value) {
    if (!value) return "";
    const [y, m, d] = value.split("-");
    return `${d}/${m}/${y}`;
}