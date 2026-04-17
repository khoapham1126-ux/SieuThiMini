// ============================================================
// donhang.js - Lịch sử đơn hàng - Nguyễn An
// ============================================================

let allOrders = []; // Toàn bộ đơn hàng từ API
let employeeNameById = new Map();

// ============================================================
// Khởi tạo
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
    loadOrders();
});

// ============================================================
// Tải danh sách đơn hàng
// ============================================================
async function loadOrders() {
    const tbody = document.getElementById("orderTableBody");
    const alertBox = document.getElementById("orderAlert");

    try {
        const [orderRes, employeeRes] = await Promise.all([
            fetch("/api/DonHang"),
            fetch("/api/NhanVien").catch(() => null)
        ]);
        if (!orderRes.ok) throw new Error("Không tải được danh sách đơn hàng");

        const data = await orderRes.json();
        allOrders = data;
        employeeNameById = buildEmployeeMap(await readEmployeesSafely(employeeRes));

        renderStats(data);
        renderOrders(data);
    } catch (err) {
        alertBox.textContent = err.message;
        alertBox.classList.remove("d-none");
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">Không tải được dữ liệu</td></tr>`;
    }
}

// ============================================================
// Render thống kê nhanh
// ============================================================
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

// ============================================================
// Render bảng đơn hàng
// ============================================================
function renderOrders(orders) {
    const tbody = document.getElementById("orderTableBody");
    const filterInfo = document.getElementById("filterInfo");

    if (!orders || orders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-5 text-muted">Không có đơn hàng nào</td></tr>`;
        filterInfo.textContent = "";
        return;
    }

    tbody.innerHTML = orders.map(order => `
        <tr>
            <td><span class="fw-semibold text-danger">#${order.id}</span></td>
            <td>${formatDate(order.ngayTao)}</td>
            <td>${order.khachHangId ? `KH #${order.khachHangId}` : '<span class="text-muted">Khách lẻ</span>'}</td>
            <td>${getCashierDisplay(order)}</td>
            <td class="text-end fw-semibold">${formatCurrency(order.tongTien)}</td>
            <td class="text-center">${renderStatusBadge(order.trangThai)}</td>
        </tr>
    `).join("");

    filterInfo.textContent = `Hiển thị ${orders.length} / ${allOrders.length} đơn hàng`;
}

function buildEmployeeMap(employees) {
    const map = new Map();
    if (!Array.isArray(employees)) return map;

    employees.forEach(nv => {
        const id = toValidIdOrNull(nv.id ?? nv.Id);
        const name = (nv.hoTen ?? nv.HoTen ?? "").trim();
        if (id !== null && name) map.set(id, name);
    });

    return map;
}

async function readEmployeesSafely(employeeRes) {
    if (!employeeRes || !employeeRes.ok) return [];
    try {
        return await employeeRes.json();
    } catch (err) {
        console.warn("Không đọc được dữ liệu nhân viên từ API:", err);
        return [];
    }
}

function getCashierDisplay(order) {
    const directName = order.nhanVienHoTen ?? order.NhanVienHoTen;
    if (directName) return directName;

    const id = toValidIdOrNull(order.nhanVienId ?? order.NhanVienId);
    if (id === null) return "---";

    return employeeNameById.get(id) ?? `NV #${id}`;
}

function toValidIdOrNull(value) {
    if (value === null || value === undefined || value === "") return null;
    const id = Number(value);
    if (!Number.isInteger(id) || id <= 0) return null;
    return id;
}

// ============================================================
// Render badge trạng thái
// ============================================================
function renderStatusBadge(status) {
    const map = {
        "DaThanhToan":  { label: "Đã thanh toán", cls: "badge-paid" },
        "ChoThanhToan": { label: "Chờ thanh toán", cls: "badge-pending" },
        "DaHuy":        { label: "Đã huỷ",         cls: "badge-cancelled" },
    };
    const info = map[status] || { label: status || "Không rõ", cls: "bg-secondary" };
    return `<span class="badge ${info.cls}">${info.label}</span>`;
}

// ============================================================
// Lọc đơn hàng
// ============================================================
function filterOrders() {
    const searchVal = document.getElementById("searchInput").value.trim().toLowerCase();
    const statusVal = document.getElementById("statusFilter").value;
    const dateVal = document.getElementById("dateFilter").value; // yyyy-mm-dd

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
            const ymd = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
            return ymd === dateVal;
        });
    }

    renderOrders(filtered);
}

// ============================================================
// Xoá bộ lọc
// ============================================================
function resetFilter() {
    document.getElementById("searchInput").value = "";
    document.getElementById("statusFilter").value = "";
    document.getElementById("dateFilter").value = "";
    renderOrders(allOrders);
}

// ============================================================
// Tiện ích: Format tiền tệ
// ============================================================
function formatCurrency(amount) {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount || 0);
}

// ============================================================
// Tiện ích: Format ngày giờ
// ============================================================
function formatDate(dateStr) {
    if (!dateStr) return "---";
    const d = new Date(dateStr);
    const date = d.toLocaleDateString("vi-VN");
    const time = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    return `${date} ${time}`;
}
