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
        // Sửa colspan thành 6
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">Không tải được dữ liệu</td></tr>`;
    }
}

function renderStats(orders) {
    const total = orders.length;
    // Tính doanh thu trên toàn bộ đơn hàng hiển thị
    const revenue = orders.reduce((sum, o) => sum + (o.tongTien || 0), 0);

    document.getElementById("statTotal").textContent = total;
    // Đã xóa dòng statPaid và statPending để tránh lỗi null
    document.getElementById("statRevenue").textContent = formatCurrency(revenue);
}

function renderOrders(orders) {
    const tbody = document.getElementById("orderTableBody");
    const filterInfo = document.getElementById("filterInfo");

    if (!orders || orders.length === 0) {
        // Sửa colspan thành 6
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-5 text-muted">Không có đơn hàng nào</td></tr>`;
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

        // Đã xóa ô "Trạng thái" trong modal, chia lại col-md-4 cho 3 ô còn lại
        body.innerHTML = `
            <div class="row g-3 mb-3">
                <div class="col-md-4">
                    <div class="summary-box">
                        <div class="text-muted small">Mã đơn</div>
                        <div class="fw-semibold">#${data.id}</div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="summary-box">
                        <div class="text-muted small">Khách hàng</div>
                        <div class="fw-semibold">${data.khachHangTen || "Khách lẻ"}</div>
                    </div>
                </div>
                <div class="col-md-4">
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

// Đã xóa hàm renderStatusBadge và translateStatus để làm sạch code

function filterOrders() {
    const searchVal = document.getElementById("searchInput").value.trim().toLowerCase();
    const dateVal = document.getElementById("dateFilter").value;

    let filtered = allOrders;

    if (searchVal) {
        filtered = filtered.filter(o => String(o.id).includes(searchVal));
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