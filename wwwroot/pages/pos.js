// ============================================================
// pos.js - Xử lý nghiệp vụ bán hàng POS - Nguyễn An
// ============================================================

let cart = []; // Mảng giỏ hàng: [{ sanPham, soLuong }]
let currentProduct = null; // Sản phẩm đang tìm được

// ============================================================
// Khởi tạo trang
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
    loadCustomers();

    // Nhấn Enter trong ô mã vạch để tìm nhanh
    document.getElementById("barcodeInput").addEventListener("keydown", (e) => {
        if (e.key === "Enter") searchByBarcode();
    });
});

// ============================================================
// Lấy NhanVienId từ localStorage (lưu lúc đăng nhập)
// ============================================================
function getNhanVienId() {
    const id = localStorage.getItem("staffId");
    return id ? Number(id) : 1; // fallback = 1 nếu chưa lưu
}

// ============================================================
// Tải danh sách khách hàng vào select
// ============================================================
async function loadCustomers() {
    const select = document.getElementById("customerSelect");
    try {
        const res = await fetch("/api/KhachHang");
        if (!res.ok) return;
        const data = await res.json();
        data.forEach(kh => {
            const opt = document.createElement("option");
            opt.value = kh.id;
            opt.textContent = `${kh.hoTen} - ${kh.soDienThoai}`;
            select.appendChild(opt);
        });
    } catch {
        // Không bắt buộc phải có khách hàng
    }
}

// ============================================================
// Tìm sản phẩm theo mã vạch
// ============================================================
async function searchByBarcode() {
    const input = document.getElementById("barcodeInput");
    const barcode = input.value.trim();
    const productCard = document.getElementById("productCard");
    const productError = document.getElementById("productError");

    // Reset trạng thái cũ
    productCard.classList.add("d-none");
    productError.classList.add("d-none");
    currentProduct = null;

    if (!barcode) return;

    try {
        const res = await fetch(`/api/SanPham/mavach/${encodeURIComponent(barcode)}`);
        const data = await res.json();

        if (!res.ok) {
            productError.textContent = data.message || `Không tìm thấy sản phẩm với mã vạch: ${barcode}`;
            productError.classList.remove("d-none");
            input.select();
            return;
        }

        // Hiện thông tin sản phẩm
        currentProduct = data;
        document.getElementById("productName").textContent = data.tenSanPham;
        document.getElementById("productBarcode").textContent = data.maVach;
        document.getElementById("productPrice").textContent = formatCurrency(data.giaBan);
        productCard.classList.remove("d-none");

        input.value = "";
        input.focus();
    } catch (err) {
        productError.textContent = "Lỗi kết nối đến server.";
        productError.classList.remove("d-none");
    }
}

// ============================================================
// Thêm sản phẩm vào giỏ
// ============================================================
function addToCart() {
    if (!currentProduct) return;

    const existing = cart.find(item => item.sanPham.maSanPham === currentProduct.maSanPham);
    if (existing) {
        existing.soLuong += 1;
    } else {
        cart.push({ sanPham: currentProduct, soLuong: 1 });
    }

    currentProduct = null;
    document.getElementById("productCard").classList.add("d-none");
    renderCart();
    document.getElementById("barcodeInput").focus();
}

// ============================================================
// Render bảng giỏ hàng
// ============================================================
function renderCart() {
    const tbody = document.getElementById("cartTableBody");

    if (cart.length === 0) {
        tbody.innerHTML = `
            <tr id="emptyCartRow">
                <td colspan="5" class="text-center py-5" style="color:#9ca3af">
                    <div style="font-size:2rem">🛒</div>
                    <div>Giỏ hàng trống</div>
                </td>
            </tr>`;
        updateTotal();
        return;
    }

    tbody.innerHTML = cart.map((item, idx) => `
        <tr>
            <td>
                <div class="fw-semibold">${item.sanPham.tenSanPham}</div>
                <div class="text-muted small">${item.sanPham.maVach}</div>
            </td>
            <td class="text-center">
                <div class="d-flex align-items-center justify-content-center gap-1">
                    <button class="btn btn-outline-secondary qty-btn" onclick="changeQty(${idx}, -1)">−</button>
                    <span class="fw-semibold px-1">${item.soLuong}</span>
                    <button class="btn btn-outline-secondary qty-btn" onclick="changeQty(${idx}, 1)">+</button>
                </div>
            </td>
            <td class="text-end">${formatCurrency(item.sanPham.giaBan)}</td>
            <td class="text-end fw-semibold text-danger">${formatCurrency(item.sanPham.giaBan * item.soLuong)}</td>
            <td class="text-center">
                <button class="btn btn-sm btn-outline-danger" onclick="removeFromCart(${idx})">✕</button>
            </td>
        </tr>
    `).join("");

    updateTotal();
}

// ============================================================
// Thay đổi số lượng sản phẩm
// ============================================================
function changeQty(idx, delta) {
    cart[idx].soLuong += delta;
    if (cart[idx].soLuong <= 0) {
        cart.splice(idx, 1);
    }
    renderCart();
}

// ============================================================
// Xoá 1 sản phẩm khỏi giỏ
// ============================================================
function removeFromCart(idx) {
    cart.splice(idx, 1);
    renderCart();
}

// ============================================================
// Xoá toàn bộ giỏ hàng
// ============================================================
function clearCart() {
    if (cart.length === 0) return;
    if (!confirm("Bạn có chắc muốn xoá toàn bộ giỏ hàng?")) return;
    cart = [];
    renderCart();
}


function updateTotal() {
    const totalItems = cart.reduce((sum, item) => sum + item.soLuong, 0);
    const totalAmount = cart.reduce((sum, item) => sum + item.sanPham.giaBan * item.soLuong, 0);

    document.getElementById("totalItems").textContent = totalItems;
    document.getElementById("totalAmount").textContent = formatCurrency(totalAmount);
    document.getElementById("checkoutBtn").disabled = cart.length === 0;
}

// ============================================================
// Thanh toán
// Luồng đúng theo đề bài:
//   1. POST /api/DonHang              → tạo đơn hàng (trạng thái ChoThanhToan)
//   2. POST /api/DonHang/{id}/chitiet → thêm từng sản phẩm vào đơn
//   3. PUT  /api/DonHang/{id}/thanhtoan → cập nhật trạng thái sang DaThanhToan
//   4. PUT  /api/TonKho/tru           → trừ kho từng sản phẩm
//
// Lý do bước 3 dùng PUT:
//   Vì thanh toán là THAY ĐỔI trạng thái của đơn hàng đã tồn tại
//   (ChoThanhToan → DaThanhToan), không tạo mới → đúng chuẩn REST dùng PUT
// ============================================================
async function checkout() {
    if (cart.length === 0) return;

    const alertBox = document.getElementById("checkoutAlert");
    alertBox.classList.add("d-none");

    const customerId = document.getElementById("customerSelect").value;
    const tongTien = cart.reduce((sum, item) => sum + item.sanPham.giaBan * item.soLuong, 0);

    try {
        // ── Bước 1: Tạo đơn hàng ──────────────────────────────
        const donHangRes = await fetch("/api/DonHang", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                NgayTao: new Date().toISOString(),
                TongTien: tongTien,
                TrangThai: "ChoThanhToan",          // ban đầu chờ thanh toán
                KhachHangId: customerId ? Number(customerId) : 0,
                NhanVienId: getNhanVienId()          // ✅ lấy từ localStorage
            })
        });

        if (!donHangRes.ok) {
            const err = await donHangRes.json().catch(() => ({}));
            throw new Error(err.message || "Tạo đơn hàng thất bại");
        }

        const donHang = await donHangRes.json();

        // ── Bước 2: Thêm chi tiết đơn hàng ───────────────────
        // POST /api/DonHang/{id}/chitiet  ✅ đúng endpoint đề bài
        await Promise.all(cart.map(item =>
            fetch(`/api/DonHang/${donHang.id}/chitiet`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    SoLuong: item.soLuong,
                    DonGia: item.sanPham.giaBan,
                    SanPhamId: item.sanPham.maSanPham
                })
            })
        ));

        // ── Bước 3: Cập nhật trạng thái thanh toán ───────────
        // PUT /api/DonHang/{id}/thanhtoan  ✅ đúng endpoint đề bài
        const thanhToanRes = await fetch(`/api/DonHang/${donHang.id}/thanhtoan`, {
            method: "PUT"
        });

        if (!thanhToanRes.ok) {
            throw new Error("Cập nhật trạng thái thanh toán thất bại");
        }
.sanP
        // ── Bước 4: Trừ kho ──────────────────────────────────
        await Promise.all(cart.map(item =>
            fetch("/api/TonKho/tru", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    SanPhamId: itemham.maSanPham,
                    SoLuong: item.soLuong
                })
            })
        ));

        // ── Thành công ────────────────────────────────────────
        cart = [];
        renderCart();

        alertBox.className = "alert alert-success mt-2";
        alertBox.textContent = `✅ Thanh toán thành công! Đơn hàng #${donHang.id} - Tổng: ${formatCurrency(tongTien)}`;
        alertBox.classList.remove("d-none");
        setTimeout(() => alertBox.classList.add("d-none"), 4000);

    } catch (err) {
        alertBox.className = "alert alert-danger mt-2";
        alertBox.textContent = `❌ Lỗi: ${err.message}`;
        alertBox.classList.remove("d-none");
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}