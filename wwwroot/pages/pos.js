// ============================================================
// pos.js — Bán hàng POS — Nguyễn An
// Tính năng:
//   ✅ Quét mã camera (html5-qrcode)
//   ✅ Thanh toán Tiền mặt / Thẻ + gửi PhuongThucThanhToan
//   ✅ Tính tiền thừa khi dùng tiền mặt
//   ✅ Kiểm tra khuyến mãi SALE còn hiệu lực → badge + giá giảm
// ============================================================

let cart = [];               // [{ sanPham, soLuong, giaThucTe, khuyenMai }]
let currentProduct = null;
let khuyenMaiList = [];      // Danh sách KM từ API
let checkoutModal = null;
let selectedPayment = "TienMat";
let html5QrcodeScanner = null;
let isCameraOn = false;

// ── KHỞI TẠO ─────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    loadCustomers();
    loadKhuyenMai();
    checkoutModal = new bootstrap.Modal(document.getElementById("checkoutModal"));

    document.getElementById("barcodeInput").addEventListener("keydown", (e) => {
        if (e.key === "Enter") searchByBarcode();
    });

    // Khi modal đóng → dừng camera nếu đang bật
    document.getElementById("checkoutModal").addEventListener("hidden.bs.modal", () => {
        document.getElementById("confirmPayBtn").disabled = false;
        document.getElementById("confirmPayBtn").textContent = "✅ Xác nhận thanh toán";
    });
});

function getNhanVienId() {
    return parseInt(localStorage.getItem("staffId") || "1");
}

// ── LOAD DỮ LIỆU ─────────────────────────────────────────────
async function loadCustomers() {
    const select = document.getElementById("customerSelect");
    try {
        const res = await fetch("/api/KhachHang");
        if (!res.ok) return;
        const data = await res.json();
        data.forEach(kh => {
            const opt = document.createElement("option");
            opt.value = kh.id;
            opt.textContent = `${kh.hoTen} — ${kh.soDienThoai}`;
            select.appendChild(opt);
        });
    } catch { /* optional */ }
}

async function loadKhuyenMai() {
    try {
        const res = await fetch("/api/KhuyenMai");
        if (!res.ok) return;
        khuyenMaiList = await res.json();
    } catch {
        khuyenMaiList = [];
    }
}

// ── CAMERA QR ─────────────────────────────────────────────────
function toggleCamera() {
    if (isCameraOn) {
        stopCamera();
    } else {
        startCamera();
    }
}

function startCamera() {
    const cameraSection = document.getElementById("cameraSection");
    const cameraBtn = document.getElementById("cameraBtn");
    const scanIndicator = document.getElementById("scanIndicator");

    cameraSection.classList.remove("d-none");
    cameraBtn.textContent = "⏹ Tắt camera";
    cameraBtn.classList.add("active");
    scanIndicator.classList.remove("d-none");

    html5QrcodeScanner = new Html5Qrcode("reader");

    Html5Qrcode.getCameras().then(cameras => {
        if (!cameras || cameras.length === 0) {
            showProductError("Không tìm thấy camera trên thiết bị.");
            stopCamera();
            return;
        }

        // Ưu tiên camera sau (back camera) trên điện thoại
        const cameraId = cameras[cameras.length - 1].id;

        html5QrcodeScanner.start(
            cameraId,
            {
                fps: 10,
                qrbox: { width: 220, height: 120 },
                aspectRatio: 1.6
            },
            (decodedText) => {
                // Quét thành công → điền vào ô input rồi tìm
                document.getElementById("barcodeInput").value = decodedText;
                searchByBarcode();
                // Tự động tắt camera sau khi quét
                stopCamera();
            },
            () => { /* scanning... */ }
        ).catch(err => {
            showProductError("Không thể truy cập camera: " + err);
            stopCamera();
        });

        isCameraOn = true;
    }).catch(() => {
        showProductError("Trình duyệt không hỗ trợ hoặc camera bị từ chối.");
        stopCamera();
    });
}

function stopCamera() {
    const cameraSection = document.getElementById("cameraSection");
    const cameraBtn = document.getElementById("cameraBtn");
    const scanIndicator = document.getElementById("scanIndicator");

    if (html5QrcodeScanner && isCameraOn) {
        html5QrcodeScanner.stop().catch(() => {});
        html5QrcodeScanner = null;
    }

    isCameraOn = false;
    cameraSection.classList.add("d-none");
    cameraBtn.textContent = "📷 Bật camera";
    cameraBtn.classList.remove("active");
    scanIndicator.classList.add("d-none");
}

// ── TÌM SẢN PHẨM ─────────────────────────────────────────────
async function searchByBarcode() {
    const input = document.getElementById("barcodeInput");
    const barcode = input.value.trim();
    const productCard = document.getElementById("productCard");

    productCard.classList.add("d-none");
    document.getElementById("productError").classList.add("d-none");
    currentProduct = null;

    if (!barcode) return;

    try {
        const res = await fetch(`/api/SanPham/mavach/${encodeURIComponent(barcode)}`);
        const data = await res.json();

        if (!res.ok) {
            showProductError(data.message || `Không tìm thấy: ${barcode}`);
            input.select();
            return;
        }

        currentProduct = data;

        // Kiểm tra khuyến mãi
        const km = getActiveKhuyenMai(data.maSanPham);

        document.getElementById("productName").textContent = data.tenSanPham;
        document.getElementById("productBarcode").textContent = data.maVach;

        if (km) {
            const giaGoc = data.giaBan;
            const giaGiam = Math.round(giaGoc * (1 - km.phanTramGiam / 100));

            document.getElementById("productSaleBadge").classList.remove("d-none");
            document.getElementById("productOriginalPrice").classList.remove("d-none");
            document.getElementById("productOriginalPrice").textContent = formatCurrency(giaGoc);
            document.getElementById("productPrice").textContent = formatCurrency(giaGiam);

            const saleInfo = document.getElementById("productSaleInfo");
            saleInfo.classList.remove("d-none");
            saleInfo.textContent = `🏷 ${km.ten} — Giảm ${km.phanTramGiam}%`;

            // Lưu giá thực tế vào currentProduct
            currentProduct._giaThucTe = giaGiam;
            currentProduct._khuyenMai = km;
        } else {
            document.getElementById("productSaleBadge").classList.add("d-none");
            document.getElementById("productOriginalPrice").classList.add("d-none");
            document.getElementById("productSaleInfo").classList.add("d-none");
            document.getElementById("productPrice").textContent = formatCurrency(data.giaBan);
            currentProduct._giaThucTe = data.giaBan;
            currentProduct._khuyenMai = null;
        }

        productCard.classList.remove("d-none");
        input.value = "";
        input.focus();
    } catch {
        showProductError("Lỗi kết nối đến server.");
    }
}

function showProductError(msg) {
    const el = document.getElementById("productError");
    el.textContent = msg;
    el.classList.remove("d-none");
}

// ── KHUYẾN MÃI ───────────────────────────────────────────────
function getActiveKhuyenMai(sanPhamId) {
    if (!khuyenMaiList || khuyenMaiList.length === 0) return null;
    const now = new Date();

    // Tìm KM còn hiệu lực (ngayBatDau <= now <= ngayKetThuc)
    // Hiện tại KhuyenMai chưa liên kết trực tiếp tới sản phẩm cụ thể
    // → lấy KM active đầu tiên (theo yêu cầu demo, có thể mở rộng sau)
    return khuyenMaiList.find(km => {
        const start = new Date(km.ngayBatDau);
        const end = new Date(km.ngayKetThuc);
        return now >= start && now <= end;
    }) || null;
}

// ── GIỎ HÀNG ─────────────────────────────────────────────────
function addToCart() {
    if (!currentProduct) return;

    const existing = cart.find(item => item.sanPham.maSanPham === currentProduct.maSanPham);
    if (existing) {
        existing.soLuong += 1;
    } else {
        cart.push({
            sanPham: currentProduct,
            soLuong: 1,
            giaThucTe: currentProduct._giaThucTe,
            khuyenMai: currentProduct._khuyenMai
        });
    }

    currentProduct = null;
    document.getElementById("productCard").classList.add("d-none");
    renderCart();
    document.getElementById("barcodeInput").focus();
}

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

    tbody.innerHTML = cart.map((item, idx) => {
        const hasKM = item.khuyenMai !== null;
        const giaGoc = item.sanPham.giaBan;
        const giaThucTe = item.giaThucTe;
        const thanhtien = giaThucTe * item.soLuong;

        const priceCell = hasKM
            ? `<div><span class="price-original">${formatCurrency(giaGoc)}</span></div>
               <div class="price-sale">${formatCurrency(giaThucTe)}</div>`
            : `<div>${formatCurrency(giaThucTe)}</div>`;

        const nameCell = hasKM
            ? `<div class="fw-semibold">${item.sanPham.tenSanPham} <span class="badge-sale">SALE</span></div>
               <div class="text-muted small">${item.sanPham.maVach}</div>`
            : `<div class="fw-semibold">${item.sanPham.tenSanPham}</div>
               <div class="text-muted small">${item.sanPham.maVach}</div>`;

        return `
        <tr>
            <td>${nameCell}</td>
            <td class="text-center">
                <div class="d-flex align-items-center justify-content-center gap-1">
                    <button class="btn btn-outline-secondary qty-btn" onclick="changeQty(${idx}, -1)">−</button>
                    <span class="fw-semibold px-1">${item.soLuong}</span>
                    <button class="btn btn-outline-secondary qty-btn" onclick="changeQty(${idx}, 1)">+</button>
                </div>
            </td>
            <td class="text-end">${priceCell}</td>
            <td class="text-end fw-semibold text-danger">${formatCurrency(thanhtien)}</td>
            <td class="text-center">
                <button class="btn btn-sm btn-outline-danger" onclick="removeFromCart(${idx})">✕</button>
            </td>
        </tr>`;
    }).join("");

    updateTotal();
}

function changeQty(idx, delta) {
    cart[idx].soLuong += delta;
    if (cart[idx].soLuong <= 0) cart.splice(idx, 1);
    renderCart();
}

function removeFromCart(idx) {
    cart.splice(idx, 1);
    renderCart();
}

function clearCart() {
    if (cart.length === 0) return;
    if (!confirm("Bạn có chắc muốn xoá toàn bộ giỏ hàng?")) return;
    cart = [];
    renderCart();
}

function updateTotal() {
    const totalItems = cart.reduce((s, i) => s + i.soLuong, 0);

    const subtotal = cart.reduce((s, i) => s + i.sanPham.giaBan * i.soLuong, 0);
    const totalAfterDiscount = cart.reduce((s, i) => s + i.giaThucTe * i.soLuong, 0);
    const discount = subtotal - totalAfterDiscount;

    document.getElementById("totalItems").textContent = totalItems;
    document.getElementById("subtotalAmount").textContent = formatCurrency(subtotal);
    document.getElementById("totalAmount").textContent = formatCurrency(totalAfterDiscount);

    const discountRow = document.getElementById("discountRow");
    if (discount > 0) {
        discountRow.style.removeProperty("display");
        document.getElementById("discountAmount").textContent = `- ${formatCurrency(discount)}`;
    } else {
        discountRow.style.setProperty("display", "none", "important");
    }

    document.getElementById("checkoutBtn").disabled = cart.length === 0;
}

// ── MODAL THANH TOÁN ─────────────────────────────────────────
function openCheckoutModal() {
    if (cart.length === 0) return;

    // Tính lại
    const subtotal = cart.reduce((s, i) => s + i.sanPham.giaBan * i.soLuong, 0);
    const total = cart.reduce((s, i) => s + i.giaThucTe * i.soLuong, 0);
    const discount = subtotal - total;

    // Tóm tắt
    document.getElementById("receiptItems").innerHTML = cart.map(item => `
        <div class="receipt-item">
            <span>
                ${item.sanPham.tenSanPham}
                ${item.khuyenMai ? `<span class="discount-badge">-${item.khuyenMai.phanTramGiam}%</span>` : ""}
                <span class="text-muted">×${item.soLuong}</span>
            </span>
            <span class="fw-semibold">${formatCurrency(item.giaThucTe * item.soLuong)}</span>
        </div>
    `).join("");

    document.getElementById("modalSubtotal").textContent = formatCurrency(subtotal);
    document.getElementById("modalTotal").textContent = formatCurrency(total);

    const discRow = document.getElementById("modalDiscountRow");
    if (discount > 0) {
        discRow.classList.remove("d-none");
        document.getElementById("modalDiscount").textContent = `- ${formatCurrency(discount)}`;
    } else {
        discRow.classList.add("d-none");
    }

    // Reset thanh toán
    selectPayment("TienMat");
    document.getElementById("tienKhachDua").value = "";
    document.getElementById("tienThua").textContent = "0 đ";
    document.getElementById("changeDisplay").className = "change-display";

    checkoutModal.show();
}

function selectPayment(method) {
    selectedPayment = method;

    document.getElementById("btnTienMat").classList.toggle("selected", method === "TienMat");
    document.getElementById("btnThe").classList.toggle("selected", method === "The");
    document.getElementById("cashSection").classList.toggle("d-none", method !== "TienMat");
    document.getElementById("cardSection").classList.toggle("d-none", method !== "The");
}

function tinhTienThua() {
    const total = cart.reduce((s, i) => s + i.giaThucTe * i.soLuong, 0);
    const khachDua = parseInt(document.getElementById("tienKhachDua").value) || 0;
    const thua = khachDua - total;

    const display = document.getElementById("changeDisplay");
    const thuaEl = document.getElementById("tienThua");

    if (khachDua === 0) {
        thuaEl.textContent = "0 đ";
        thuaEl.style.color = "#16a34a";
        display.className = "change-display";
        return;
    }

    if (thua >= 0) {
        thuaEl.textContent = formatCurrency(thua);
        thuaEl.style.color = "#16a34a";
        display.className = "change-display";
    } else {
        thuaEl.textContent = `Thiếu ${formatCurrency(-thua)}`;
        thuaEl.style.color = "#dc2626";
        display.className = "change-display negative";
    }
}

// ── THANH TOÁN ───────────────────────────────────────────────
async function confirmCheckout() {
    // Validate tiền mặt
    if (selectedPayment === "TienMat") {
        const total = cart.reduce((s, i) => s + i.giaThucTe * i.soLuong, 0);
        const khachDua = parseInt(document.getElementById("tienKhachDua").value) || 0;
        if (khachDua < total) {
            alert("Tiền khách đưa chưa đủ! Vui lòng nhập đúng số tiền.");
            document.getElementById("tienKhachDua").focus();
            return;
        }
    }

    const btn = document.getElementById("confirmPayBtn");
    btn.disabled = true;
    btn.textContent = "Đang xử lý...";

    const tongTien = cart.reduce((s, i) => s + i.giaThucTe * i.soLuong, 0);
    const customerId = document.getElementById("customerSelect").value;

    try {
        // ── Bước 1: Tạo đơn hàng ──────────────────────────────
        const donHangRes = await fetch("/api/DonHang", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                NgayTao: new Date().toISOString(),
                TongTien: tongTien,
                TrangThai: "ChoThanhToan",
                KhachHangId: customerId ? Number(customerId) : 0,
                NhanVienId: getNhanVienId(),
                PhuongThucThanhToan: selectedPayment
            })
        });

        if (!donHangRes.ok) {
            const err = await donHangRes.json().catch(() => ({}));
            throw new Error(err.message || "Tạo đơn hàng thất bại");
        }

        const donHang = await donHangRes.json();

        // ── Bước 2: Thêm chi tiết đơn hàng ───────────────────
        await Promise.all(cart.map(item =>
            fetch(`/api/DonHang/${donHang.id}/chitiet`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    SoLuong: item.soLuong,
                    DonGia: item.giaThucTe,      // giá sau giảm
                    SanPhamId: item.sanPham.maSanPham
                })
            })
        ));

        // ── Bước 3: Thanh toán ────────────────────────────────
        const thanhToanRes = await fetch(`/api/DonHang/${donHang.id}/thanhtoan`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                PhuongThucThanhToan: selectedPayment
            })
        });

        if (!thanhToanRes.ok) throw new Error("Cập nhật trạng thái thanh toán thất bại");

        // ── Bước 4: Trừ kho FEFO ─────────────────────────────
        await Promise.all(cart.map(item =>
            fetch("/api/TonKho/tru", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    SanPhamId: item.sanPham.maSanPham,
                    SoLuong: item.soLuong
                })
            })
        ));

        // ── Thành công ────────────────────────────────────────
        checkoutModal.hide();

        const phuongThucLabel = selectedPayment === "TienMat" ? "Tiền mặt" : "Thẻ/Chuyển khoản";
        showCheckoutSuccess(donHang.id, tongTien, phuongThucLabel);

        cart = [];
        renderCart();

    } catch (err) {
        btn.disabled = false;
        btn.textContent = "✅ Xác nhận thanh toán";

        const alertBox = document.getElementById("checkoutAlert");
        alertBox.className = "alert alert-danger mt-2";
        alertBox.textContent = `❌ Lỗi: ${err.message}`;
        alertBox.classList.remove("d-none");
        checkoutModal.hide();
    }
}

function showCheckoutSuccess(orderId, total, phuongThuc) {
    const alertBox = document.getElementById("checkoutAlert");
    alertBox.className = "alert alert-success mt-2";
    alertBox.innerHTML = `
        ✅ <strong>Thanh toán thành công!</strong> 
        Đơn hàng <strong>#${orderId}</strong> — 
        Tổng: <strong>${formatCurrency(total)}</strong> — 
        ${phuongThuc}
    `;
    alertBox.classList.remove("d-none");
    setTimeout(() => alertBox.classList.add("d-none"), 6000);
}

// ── HELPER ───────────────────────────────────────────────────
function formatCurrency(amount) {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount || 0);
}