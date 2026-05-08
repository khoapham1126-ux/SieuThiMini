/* ============================================================
   baocao.js – Báo cáo kinh doanh | Siêu Thị Mini
   ============================================================ */

const API_BASE = '/api/BaoCao';
let revenueChartInstance = null;

// ── Utilities ────────────────────────────────────────────────

function fmt(value) {
    if (value === null || value === undefined) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
}

function fmtDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtDateShort(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

function getDateRange(filter) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let from, to;

    switch (filter) {
        case 'today':
            from = to = new Date(today);
            break;
        case '7days':
            from = new Date(today);
            from.setDate(today.getDate() - 6);
            to = new Date(today);
            break;
        case 'quarter': {
            const q = Math.floor(today.getMonth() / 3);
            from = new Date(today.getFullYear(), q * 3, 1);
            to = new Date(today.getFullYear(), q * 3 + 3, 0);
            break;
        }
        case 'month':
        default:
            from = new Date(today.getFullYear(), today.getMonth(), 1);
            to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            break;
    }

    return {
        from: from.toISOString().slice(0, 10),
        to: to.toISOString().slice(0, 10)
    };
}

function buildQuery(from, to) {
    return `?from=${from}&to=${to}`;
}

// ── State ─────────────────────────────────────────────────────

let state = {
    filter: 'month',
    from: null,
    to: null
};

function getCurrentRange() {
    if (state.filter === 'custom' && state.from && state.to) {
        return { from: state.from, to: state.to };
    }
    return getDateRange(state.filter);
}

// ── KPI Cards ─────────────────────────────────────────────────

async function loadOverview() {
    const { from, to } = getCurrentRange();
    try {
        const res = await fetch(`${API_BASE}/overview${buildQuery(from, to)}`);
        if (!res.ok) throw new Error('Lỗi tải dữ liệu');
        const d = await res.json();

        document.getElementById('kpiRevenue').textContent = fmt(d.revenue);
        document.getElementById('kpiRevenueOrders').textContent = `${d.totalPaid} đơn đã thanh toán`;

        document.getElementById('kpiCOGS').textContent = fmt(d.giaVonHangBan);
        document.getElementById('kpiChiPhiNhap').textContent = `Tiền nhập hàng: ${fmt(d.chiPhiNhap)}`;

        document.getElementById('kpiProfit').textContent = fmt(d.loiNhuanGop);
        document.getElementById('kpiMarginSub').textContent = `Biên lợi nhuận: ${d.tyLeLoiNhuan}%`;

        document.getElementById('kpiOrders').textContent = d.totalOrders.toLocaleString('vi-VN');
        document.getElementById('kpiOrdersSub').textContent = `Chờ: ${d.totalPending} | Huỷ: ${d.totalCancelled}`;

        document.getElementById('kpiAvg').textContent = fmt(d.avgOrderValue);

        const margin = Math.min(Math.max(d.tyLeLoiNhuan, 0), 100);
        document.getElementById('kpiMargin').textContent = `${d.tyLeLoiNhuan}%`;
        document.getElementById('marginBar').style.width = `${margin}%`;

        // Update range label
        document.getElementById('rangeLabel').textContent =
            `Kỳ báo cáo: ${fmtDate(from)} – ${fmtDate(to)}`;
        document.getElementById('currentRangeLabel').innerHTML =
            `📅 ${fmtDate(from)} – ${fmtDate(to)}`;

    } catch (err) {
        console.error('Overview error:', err);
        document.getElementById('kpiRevenue').textContent = 'Lỗi';
    }
}

// ── Chart & Daily Table ───────────────────────────────────────

async function loadDailyData() {
    const { from, to } = getCurrentRange();
    const loading = document.getElementById('chartLoading');
    loading.classList.add('show');

    try {
        const res = await fetch(`${API_BASE}/daily${buildQuery(from, to)}`);
        if (!res.ok) throw new Error('Lỗi tải dữ liệu');
        const data = await res.json();

        renderChart(data);
        renderDailyTable(data);
    } catch (err) {
        console.error('Daily error:', err);
        document.getElementById('dailyTableBody').innerHTML =
            '<tr><td colspan="6" class="text-center text-danger py-4">Không tải được dữ liệu</td></tr>';
    } finally {
        loading.classList.remove('show');
    }
}

function renderChart(data) {
    const labels = data.map(d => fmtDateShort(d.date));
    const revenues = data.map(d => d.revenue);
    const cogsArr = data.map(d => d.cogs);
    const chiPhiArr = data.map(d => d.chiPhiNhap);
    const profits = data.map(d => d.revenue - d.cogs);

    const ctx = document.getElementById('revenueChart').getContext('2d');
    if (revenueChartInstance) revenueChartInstance.destroy();

    revenueChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: 'Doanh thu',
                    data: revenues,
                    backgroundColor: 'rgba(220, 38, 38, 0.75)',
                    borderRadius: 5,
                    order: 3
                },
                {
                    label: 'Giá vốn hàng bán (COGS)',
                    data: cogsArr,
                    backgroundColor: 'rgba(217, 119, 6, 0.70)',
                    borderRadius: 5,
                    order: 3
                },
                {
                    label: 'Tiền nhập hàng',
                    data: chiPhiArr,
                    type: 'line',
                    borderColor: '#7c3aed',
                    backgroundColor: 'rgba(124, 58, 237, 0.08)',
                    borderWidth: 2,
                    borderDash: [5, 4],
                    pointBackgroundColor: '#7c3aed',
                    pointRadius: 4,
                    tension: 0.35,
                    fill: false,
                    order: 1
                },
                {
                    label: 'Lợi nhuận gộp',
                    data: profits,
                    type: 'line',
                    borderColor: '#16a34a',
                    backgroundColor: 'rgba(22, 163, 74, 0.10)',
                    borderWidth: 2.5,
                    pointBackgroundColor: '#16a34a',
                    pointRadius: 4,
                    tension: 0.35,
                    fill: true,
                    order: 2
                }
            ]
        },
        options: {
            responsive: true,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                    callbacks: {
                        label: ctx => ` ${ctx.dataset.label}: ${fmt(ctx.raw)}`
                    }
                }
            },
            scales: {
                y: {
                    ticks: {
                        callback: v => {
                            if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
                            if (v >= 1_000) return (v / 1_000).toFixed(0) + 'K';
                            return v;
                        }
                    },
                    grid: { color: 'rgba(0,0,0,0.05)' }
                },
                x: { grid: { display: false } }
            }
        }
    });
}

function renderDailyTable(data) {
    const tbody = document.getElementById('dailyTableBody');
    if (!data.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">Không có dữ liệu</td></tr>';
        return;
    }

    tbody.innerHTML = data.map(row => {
        // Lợi nhuận gộp = Doanh thu - COGS (chính xác)
        const loiNhuan = row.revenue - row.cogs;
        const profitClass = loiNhuan >= 0 ? 'profit-positive' : 'profit-negative';
        const profitSign = loiNhuan >= 0 ? '+' : '';

        return `
        <tr>
            <td>${fmtDate(row.date)}</td>
            <td class="text-center">${row.orders}</td>
            <td class="text-end">${fmt(row.revenue)}</td>
            <td class="text-end" style="color:#d97706">${fmt(row.cogs)}</td>
            <td class="text-end" style="color:#7c3aed">${fmt(row.chiPhiNhap)}</td>
            <td class="text-end ${profitClass}">${profitSign}${fmt(loiNhuan)}</td>
        </tr>`;
    }).join('');
}

// ── Top Products ──────────────────────────────────────────────

async function loadTopProducts() {
    const { from, to } = getCurrentRange();
    const limit = document.getElementById('topProductsLimit').value;

    try {
        const res = await fetch(`${API_BASE}/top-products?take=${limit}&from=${from}&to=${to}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        renderTopProducts(data);
    } catch {
        document.getElementById('topProductsBody').innerHTML =
            '<tr><td colspan="7" class="text-center text-danger py-4">Không tải được dữ liệu</td></tr>';
    }
}

function renderTopProducts(data) {
    const tbody = document.getElementById('topProductsBody');
    if (!data.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">Không có dữ liệu</td></tr>';
        return;
    }

    const maxRevenue = Math.max(...data.map(d => d.doanhThu), 1);

    tbody.innerHTML = data.map((item, i) => {
        const pct = (item.doanhThu / maxRevenue * 100).toFixed(0);
        const profitClass = item.loiNhuan >= 0 ? 'profit-positive' : 'profit-negative';
        return `
        <tr>
            <td><span class="fw-bold" style="color:#9ca3af">#${i + 1}</span></td>
            <td>
                <div class="fw-semibold">${item.tenSanPham || '—'}</div>
                <div class="progress-bar-custom" style="max-width:160px">
                    <div class="progress-fill" style="width:${pct}%"></div>
                </div>
            </td>
            <td class="text-center">${item.soLuongBan.toLocaleString('vi-VN')}</td>
            <td class="text-end">${fmt(item.doanhThu)}</td>
            <td class="text-end">${fmt(item.giaVonHangBan)}</td>
            <td class="text-end ${profitClass}">${fmt(item.loiNhuan)}</td>
            <td class="text-end">
                <span class="badge ${item.tyLeLoiNhuan >= 20 ? 'bg-success' : item.tyLeLoiNhuan >= 10 ? 'bg-warning text-dark' : 'bg-danger'}">
                    ${item.tyLeLoiNhuan}%
                </span>
            </td>
        </tr>`;
    }).join('');
}

// ── Nhập hàng ─────────────────────────────────────────────────

async function loadNhapHang() {
    const { from, to } = getCurrentRange();

    try {
        const res = await fetch(`${API_BASE}/nhap-hang${buildQuery(from, to)}`);
        if (!res.ok) throw new Error();
        const result = await res.json();

        document.getElementById('nhapTongChiPhi').textContent = fmt(result.tongChiPhi);
        document.getElementById('nhapSoPhieu').textContent = `${result.soPhieu} phiếu nhập`;

        // Lấy doanh thu đang hiển thị trên KPI
        const rev = document.getElementById('kpiRevenue').textContent;
        document.getElementById('nhapDoanhThu').textContent = rev;

        renderNhapHang(result.data);
    } catch {
        document.getElementById('nhapHangBody').innerHTML =
            '<tr><td colspan="4" class="text-center text-danger py-4">Không tải được dữ liệu</td></tr>';
    }
}

function renderNhapHang(data) {
    const tbody = document.getElementById('nhapHangBody');
    if (!data.length) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">Không có phiếu nhập</td></tr>';
        return;
    }

    tbody.innerHTML = data.map(row => `
        <tr>
            <td><span class="badge bg-warning text-dark">PN-${String(row.id).padStart(4, '0')}</span></td>
            <td>${fmtDate(row.ngayNhap)}</td>
            <td>${row.tenNCC || `NCC #${row.nhaCungCapId}`}</td>
            <td class="text-end fw-semibold" style="color:#d97706">${fmt(row.tongTien)}</td>
        </tr>`).join('');
}

// ── Tabs ──────────────────────────────────────────────────────

function initTabs() {
    const tabs = document.querySelectorAll('.report-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const target = tab.dataset.tab;
            document.querySelectorAll('[id^="tab-"]').forEach(el => el.classList.add('d-none'));
            document.getElementById(`tab-${target}`)?.classList.remove('d-none');

            if (target === 'sanPham') loadTopProducts();
            if (target === 'nhapHang') loadNhapHang();
        });
    });
}

// ── Filter chips ──────────────────────────────────────────────

function initFilters() {
    const chips = document.querySelectorAll('.filter-chip');
    const customBox = document.getElementById('customRangeBox');

    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            chips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            state.filter = chip.dataset.filter;

            if (state.filter === 'custom') {
                customBox.classList.add('show');
            } else {
                customBox.classList.remove('show');
                state.from = null;
                state.to = null;
                refreshAll();
            }
        });
    });

    document.getElementById('btnApply').addEventListener('click', () => {
        const from = document.getElementById('fromDate').value;
        const to = document.getElementById('toDate').value;
        if (!from || !to) {
            alert('Vui lòng chọn đầy đủ ngày bắt đầu và kết thúc');
            return;
        }
        if (from > to) {
            alert('Ngày bắt đầu phải trước ngày kết thúc');
            return;
        }
        state.from = from;
        state.to = to;
        refreshAll();
    });

    document.getElementById('btnReset').addEventListener('click', () => {
        document.getElementById('fromDate').value = '';
        document.getElementById('toDate').value = '';
        state.filter = 'month';
        state.from = null;
        state.to = null;
        chips.forEach(c => c.classList.remove('active'));
        document.querySelector('[data-filter="month"]').classList.add('active');
        customBox.classList.remove('show');
        refreshAll();
    });
}

// ── Refresh all visible sections ──────────────────────────────

function refreshAll() {
    loadOverview();
    loadDailyData();

    const activeTab = document.querySelector('.report-tab.active')?.dataset.tab;
    if (activeTab === 'sanPham') loadTopProducts();
    if (activeTab === 'nhapHang') loadNhapHang();
}

// ── Top products limit change ─────────────────────────────────

document.getElementById('topProductsLimit')?.addEventListener('change', loadTopProducts);

// ── User info ─────────────────────────────────────────────────

function loadUserInfo() {
    try {
        const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
        if (user.hoTen) {
            document.getElementById('staffName').textContent = user.hoTen;
            document.getElementById('userAvatar').textContent = user.hoTen.charAt(0).toUpperCase();
        }
    } catch { /* ignore */ }
}

// ── Init ──────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    loadUserInfo();
    initTabs();
    initFilters();

    const { from, to } = getDateRange('month');
    document.getElementById('fromDate').value = from;
    document.getElementById('toDate').value = to;

    loadOverview();
    loadDailyData();
});