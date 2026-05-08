let chart = null;
let currentFrom = "";
let currentTo = "";
let currentFilter = "month";
let overviewData = null;
let importData = null;

// ── KHỞI ĐỘNG ────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    renderUserInfo();
    bindEvents();
    applyFilter("month");
});

// ── BIND EVENTS ──────────────────────────────────────────────
function bindEvents() {
    // Filter chips
    document.querySelectorAll(".filter-chip").forEach(btn => {
        btn.addEventListener("click", () => {
            const f = btn.dataset.filter;
            document.querySelectorAll(".filter-chip").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            if (f === "custom") {
                document.getElementById("customDateBox").classList.add("show");
            } else {
                document.getElementById("customDateBox").classList.remove("show");
                applyFilter(f);
            }
        });
    });

    // Nút xem (custom date)
    document.getElementById("btnApply").addEventListener("click", () => {
        const from = document.getElementById("fromDate").value;
        const to = document.getElementById("toDate").value;
        if (!from || !to) { alert("Vui lòng chọn đủ ngày bắt đầu và kết thúc!"); return; }
        if (from > to) { alert("Ngày bắt đầu phải trước ngày kết thúc!"); return; }
        currentFrom = from;
        currentTo = to;
        currentFilter = "custom";
        loadAll();
    });

    // Tabs
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            const tab = btn.dataset.tab;
            document.getElementById("tab-daily").classList.toggle("d-none", tab !== "daily");
            document.getElementById("tab-products").classList.toggle("d-none", tab !== "products");
            document.getElementById("tab-imports").classList.toggle("d-none", tab !== "imports");

            if (tab === "products") loadTopProducts();
            if (tab === "imports") renderImports();
        });
    });
}

// ── TÍNH NGÀY THEO FILTER ────────────────────────────────────
function applyFilter(filter) {
    const today = new Date();
    const fmt = d => d.toISOString().split("T")[0];

    if (filter === "today") {
        currentFrom = fmt(today);
        currentTo = fmt(today);
    } else if (filter === "7days") {
        const from = new Date(today);
        from.setDate(today.getDate() - 6);
        currentFrom = fmt(from);
        currentTo = fmt(today);
    } else { // month
        currentFrom = fmt(new Date(today.getFullYear(), today.getMonth(), 1));
        currentTo = fmt(today);
    }

    currentFilter = filter;
    loadAll();
}

// ── LOAD TẤT CẢ ──────────────────────────────────────────────
async function loadAll() {
    updateRangeLabel();
    await Promise.all([loadOverview(), loadDaily(), loadImportData()]);
}

function updateRangeLabel() {
    const fmtVN = s => {
        const [y, m, d] = s.split("-");
        return `${d}/${m}/${y}`;
    };
    const label = currentFrom === currentTo
        ? `Ngày ${fmtVN(currentFrom)}`
        : `Từ ${fmtVN(currentFrom)} đến ${fmtVN(currentTo)}`;
    document.getElementById("rangeLabel").textContent = `Đang xem: ${label}`;
}

// ── OVERVIEW ─────────────────────────────────────────────────
async function loadOverview() {
    try {
        const res = await fetch(`/api/BaoCao/overview?from=${currentFrom}&to=${currentTo}`);
        if (!res.ok) return;
        overviewData = await res.json();
        renderSummary();
    } catch { }
}

function renderSummary() {
    if (!overviewData) return;
    const d = overviewData;

    document.getElementById("sumRevenue").textContent = fmt(d.revenue);
    document.getElementById("sumRevenueOrders").textContent = `${d.totalPaid} đơn đã thanh toán`;

    // Tiền nhập lấy từ importData nếu có
    if (importData !== null) {
        document.getElementById("sumImport").textContent = fmt(importData.tongChiPhi || 0);
        document.getElementById("sumImportCount").textContent = `${importData.soPhieu || 0} phiếu nhập`;
    }

    const profit = d.loiNhuanGop ?? 0;
    const profitEl = document.getElementById("sumProfit");
    profitEl.textContent = fmt(profit);
    profitEl.className = `value ${profit >= 0 ? "profit-pos" : "profit-neg"}`;

}

// ── DAILY ────────────────────────────────────────────────────
async function loadDaily() {
    try {
        const res = await fetch(`/api/BaoCao/daily?from=${currentFrom}&to=${currentTo}`);
        if (!res.ok) return;
        const data = await res.json();
        renderDailyTable(data);
        renderChart(data);
    } catch { }
}

function renderDailyTable(data) {
    const tbody = document.getElementById("dailyBody");
    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" class="text-center text-muted py-4">Không có dữ liệu trong khoảng thời gian này</td></tr>`;
        return;
    }

    tbody.innerHTML = data.map(row => {
        const dateStr = new Date(row.date).toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" });
        return `
        <tr>
            <td class="fw-semibold">${dateStr}</td>
            <td class="text-center">${row.orders ?? 0} đơn</td>
            <td class="text-end">${fmt(row.revenue)}</td>
        </tr>`;
    }).join("");
}

function renderChart(data) {
    const ctx = document.getElementById("chartDaily");
    if (!ctx) return;

    const labels = data.map(x => new Date(x.date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }));
    const revenues = data.map(x => x.revenue);
    const costs = data.map(x => x.chiPhi || 0);

    if (chart) chart.destroy();

    chart = new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [
                {
                    label: "Tiền bán",
                    data: revenues,
                    backgroundColor: "rgba(220, 38, 38, 0.8)",
                    borderRadius: 6,
                    order: 1
                },
                {
                    label: "Tiền nhập hàng",
                    data: costs,
                    backgroundColor: "rgba(217, 119, 6, 0.7)",
                    borderRadius: 6,
                    order: 2
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true, position: "top" },
                tooltip: {
                    callbacks: {
                        label: ctx => `${ctx.dataset.label}: ${new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(ctx.raw)}`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: v => new Intl.NumberFormat("vi-VN", { notation: "compact", maximumFractionDigits: 1 }).format(v) + "đ"
                    }
                }
            }
        }
    });
}

// ── TOP PRODUCTS ─────────────────────────────────────────────
async function loadTopProducts() {
    const take = document.getElementById("topLimit")?.value || 10;
    const tbody = document.getElementById("productsBody");
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">Đang tải...</td></tr>`;

    try {
        const res = await fetch(`/api/BaoCao/top-products?take=${take}&from=${currentFrom}&to=${currentTo}`);
        if (!res.ok) throw new Error();
        const data = await res.json();

        if (!data || data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">Không có dữ liệu</td></tr>`;
            return;
        }

        tbody.innerHTML = data.map((item, i) => {
            const loi = item.loiNhuan ?? (item.doanhThu - item.giaVonHangBan);
            const loiClass = loi >= 0 ? "profit-pos" : "profit-neg";
            return `
            <tr>
                <td class="text-muted fw-semibold">${i + 1}</td>
                <td class="fw-semibold">${item.tenSanPham || "—"}</td>
                <td class="text-center">${item.soLuongBan}</td>
                <td class="text-end">${fmt(item.doanhThu)}</td>
                <td class="text-end" style="color:#d97706">${fmt(item.giaVonHangBan)}</td>
                <td class="text-end ${loiClass}">${fmt(loi)}</td>
            </tr>`;
        }).join("");
    } catch {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger py-4">Lỗi tải dữ liệu</td></tr>`;
    }
}

// ── IMPORT DATA ──────────────────────────────────────────────
async function loadImportData() {
    try {
        const res = await fetch(`/api/BaoCao/nhap-hang?from=${currentFrom}&to=${currentTo}`);
        if (!res.ok) return;
        importData = await res.json();

        // Cập nhật ô tóm tắt
        document.getElementById("sumImport").textContent = fmt(importData.tongChiPhi || 0);
        document.getElementById("sumImportCount").textContent = `${importData.soPhieu || 0} phiếu nhập`;

        // Cập nhật lại lời ước tính nếu overview đã có
        if (overviewData) renderSummary();
    } catch { }
}

function renderImports() {
    const tbody = document.getElementById("importsBody");
    if (!importData || !importData.data || importData.data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">Không có phiếu nhập trong khoảng thời gian này</td></tr>`;
        return;
    }

    tbody.innerHTML = importData.data.map(p => `
        <tr>
            <td class="text-muted fw-semibold">#${p.id}</td>
            <td>${new Date(p.ngayNhap).toLocaleDateString("vi-VN")}</td>
            <td>${p.tenNCC || "—"}</td>
            <td class="text-end fw-semibold" style="color:#d97706">${fmt(p.tongTien)}</td>
        </tr>
    `).join("");
}

// ── HELPER ───────────────────────────────────────────────────
function fmt(amount) {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount || 0);
}