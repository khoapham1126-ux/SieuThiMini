let allOrders = [];
let currentOrderDetail = null;
let modalDonHang = null;

document.addEventListener("DOMContentLoaded", () => {
    const modalEl = document.getElementById("modalChiTietDonHang");
    if (typeof bootstrap !== "undefined" && modalEl) {
        modalDonHang = new bootstrap.Modal(modalEl);
    }
    loadOrders();
});

async function loadOrders() {
    const tbody = document.getElementById("orderTableBody");
    const alertBox = document.getElementById("orderAlert");

    try {
        const res = await fetch("/api/DonHang");
        if (!res.ok) throw new Error("Không tải được danh sách đơn hàng");

        const data = await res.json();
        allOrders = data;

        renderStats(data);
        renderOrders(data);
    } catch (err) {
        alertBox.textContent = err.message;
        alertBox.classList.remove("d-none");
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">Không tải được dữ liệu</td></tr>`;
    }
}

function renderStats(orders) {
    const total = orders.length;
    const paid = orders.filter(o => o.trangThai === "DaThanhToan").length;
    const pending = orders.filter(o => o.trangThai === "ChoThanhToan").length;
    const revenue = orders
        .filter(o => o.trangThai === "DaThanhToan")
        .reduce((sum, o) => sum + (o.tongTien || 0), 0);

    document.getElementById("statTotal").textContent = total;
    document.getElementById("statPaid").textContent = paid;
    document.getElementById("statPending").textContent = pending;
    document.getElementById("statRevenue").textContent = formatCurrency(revenue);
}

function renderOrders(orders) {
    const tbody = document.getElementById("orderTableBody");
    const filterInfo = document.getElementById("filterInfo");

    if (!orders || orders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-5 text-muted">Không có đơn hàng nào</td></tr>`;
        filterInfo.textContent = "";
        return;
    }

    tbody.innerHTML = orders.map(order => `
        <tr>
            <td><span class="fw-semibold text-danger">#${order.id}</span></td>
            <td>${formatDate(order.ngayTao)}</td>
            <td>${order.khachHangTen || "Khách lẻ"}</td>
            <td>${order.nhanVienTen || "Nhân viên"}</td>
            <td class="text-end fw-semibold">${formatCurrency(order.tongTien)}</td>
            <td class="text-center">${renderStatusBadge(order.trangThai)}</td>
            <td class="text-center">
                <button class="btn btn-sm btn-outline-primary" onclick="loadOrderDetail(${order.id})">
                    Xem chi tiết
                </button>
            </td>
        </tr>
    `).join("");

    filterInfo.textContent = `Hiển thị ${orders.length} / ${allOrders.length} đơn hàng`;
}

async function loadOrderDetail(orderId) {
    const body = document.getElementById("modalBodyDonHang");
    const title = document.getElementById("modalTitleDonHang");

    title.textContent = `Chi tiết đơn hàng #${orderId}`;
    body.innerHTML = `<div class="text-center text-muted py-4">Đang tải...</div>`;

    if (!modalDonHang) {
        const modalEl = document.getElementById("modalChiTietDonHang");
        modalDonHang = new bootstrap.Modal(modalEl);
    }

    modalDonHang.show();

    try {
        const res = await fetch(`/api/DonHang/${orderId}/chitiet`);
        if (!res.ok) throw new Error("Không tải được chi tiết đơn hàng");

        const data = await res.json();
        currentOrderDetail = data;

        body.innerHTML = `
            <div class="row g-3 mb-3">
                <div class="col-md-3">
                    <div class="summary-box">
                        <div class="text-muted small">Mã đơn</div>
                        <div class="fw-semibold">#${data.id}</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="summary-box">
                        <div class="text-muted small">Khách hàng</div>
                        <div class="fw-semibold">${data.khachHangTen || "Khách lẻ"}</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="summary-box">
                        <div class="text-muted small">Trạng thái</div>
                        <div class="fw-semibold">${translateStatus(data.trangThai)}</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="summary-box">
                        <div class="text-muted small">Tổng tiền</div>
                        <div class="fw-semibold text-danger">${formatCurrency(data.tongTien)}</div>
                    </div>
                </div>
            </div>

            <div class="table-responsive">
                <table class="table align-middle">
                    <thead>
                        <tr>
                            <th>Sản phẩm</th>
                            <th class="text-center">Số lượng</th>
                            <th class="text-end">Đơn giá</th>
                            <th class="text-end">Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.chiTiet && data.chiTiet.length > 0
                ? data.chiTiet.map(item => `
                                    <tr>
                                        <td>${item.tenSanPham ?? "—"}</td>
                                        <td class="text-center">${item.soLuong}</td>
                                        <td class="text-end">${formatCurrency(item.donGia)}</td>
                                        <td class="text-end fw-semibold">${formatCurrency(item.thanhTien)}</td>
                                    </tr>
                                `).join("")
                : `<tr><td colspan="4" class="text-center text-muted py-3">Không có chi tiết</td></tr>`
            }
                    </tbody>
                </table>
            </div>
        `;
    } catch (err) {
        body.innerHTML = `<div class="text-center text-danger py-4">Không tải được chi tiết: ${err.message}</div>`;
    }
}

function renderStatusBadge(status) {
    const map = {
        "DaThanhToan": { label: "Đã thanh toán", cls: "badge-paid" },
        "ChoThanhToan": { label: "Chờ thanh toán", cls: "badge-pending" },
        "DaHuy": { label: "Đã huỷ", cls: "badge-cancelled" },
    };
    const info = map[status] || { label: status || "Không rõ", cls: "bg-secondary" };
    return `<span class="badge ${info.cls}">${info.label}</span>`;
}

function translateStatus(status) {
    switch ((status || "").toLowerCase()) {
        case "dathanhtoan":
            return "Đã thanh toán";
        case "chothanhtoan":
            return "Chờ thanh toán";
        case "dahuy":
            return "Đã huỷ";
        default:
            return status || "—";
    }
}

function filterOrders() {
    const searchVal = document.getElementById("searchInput").value.trim().toLowerCase();
    const statusVal = document.getElementById("statusFilter").value;
    const dateVal = document.getElementById("dateFilter").value;

    let filtered = allOrders;

    if (searchVal) {
        filtered = filtered.filter(o => String(o.id).includes(searchVal));
    }

    if (statusVal) {
        filtered = filtered.filter(o => o.trangThai === statusVal);
    }

    if (dateVal) {
        filtered = filtered.filter(o => {
            if (!o.ngayTao) return false;
            const d = new Date(o.ngayTao);
            const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
            return ymd === dateVal;
        });
    }

    renderOrders(filtered);
}

function resetFilter() {
    document.getElementById("searchInput").value = "";
    document.getElementById("statusFilter").value = "";
    document.getElementById("dateFilter").value = "";
    renderOrders(allOrders);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount || 0);
}

function formatDate(dateStr) {
    if (!dateStr) return "---";
    const d = new Date(dateStr);
    const date = d.toLocaleDateString("vi-VN");
    const time = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    return `${date} ${time}`;
}   