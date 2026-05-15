// ============================================================
// pos.js — Bán hàng POS
// ============================================================

let cart = [];
let currentProduct = null;
let checkoutModal = null;
let selectedPayment = "TienMat";
let html5QrcodeScanner = null;
let isCameraOn = false;
let selectedCustomerData = null;
let usedPoints = 0;
let allProducts = [];

document.addEventListener("DOMContentLoaded", () => {
    loadProducts();
    checkoutModal = new bootstrap.Modal(document.getElementById("checkoutModal"));

    document.getElementById("barcodeInput").addEventListener("keydown", (e) => {
        if (e.key === "Enter") searchByBarcode();
    });

    document.getElementById("checkoutModal").addEventListener("hidden.bs.modal", () => {
        document.getElementById("confirmPayBtn").disabled = false;
        document.getElementById("confirmPayBtn").textContent = "✅ Xác nhận thanh toán";
    });

    const customerInput = document.getElementById("customerSearchInput");
    const usedPointInput = document.getElementById("usedPointInput");

    if (customerInput) {
        customerInput.addEventListener("input", () => {
            const phone = customerInput.value.trim();
            const hiddenCustomer = document.getElementById("customerSelect");
            const box = document.getElementById("selectedCustomerBox");
            const nameEl = document.getElementById("selectedCustomerName");
            const phoneEl = document.getElementById("selectedCustomerPhone");
            const pointEl = document.getElementById("selectedCustomerPoint");
            const pointHint = document.getElementById("pointHint");

            selectedCustomerData = null;
            usedPoints = 0;

            if (usedPointInput) {
                usedPointInput.value = 0;
                usedPointInput.disabled = true;
            }

            if (!phone) {
                hiddenCustomer.value = "";
                nameEl.textContent = "Chưa chọn khách hàng";
                phoneEl.textContent = "";
                pointEl.textContent = "";
                if (pointHint) pointHint.textContent = "Chọn khách hàng để dùng điểm";
                box.className = "p-3 rounded border bg-light";
                updateTotal();
                return;
            }

            clearTimeout(window.__customerSearchTimer);
            window.__customerSearchTimer = setTimeout(async () => {
                try {
                    const res = await fetch("/api/KhachHang");
                    if (!res.ok) {
                        nameEl.textContent = "Không tải được danh sách khách hàng.";
                        phoneEl.textContent = "";
                        pointEl.textContent = "";
                        box.className = "p-3 rounded border bg-light";
                        return;
                    }

                    const data = await res.json();
                    const phoneNorm = phone.replace(/\D/g, "");

                    const found = data.find(kh => {
                        const khPhone = (kh.soDienThoai ?? kh.SoDienThoai ?? "").toString().replace(/\D/g, "");
                        return khPhone.includes(phoneNorm);
                    });

                    if (!found) {
                        hiddenCustomer.value = "";
                        nameEl.textContent = "Không tìm thấy khách hàng";
                        phoneEl.textContent = `SĐT: ${phone}`;
                        pointEl.textContent = "";
                        if (pointHint) pointHint.textContent = "Không có khách để dùng điểm";
                        box.className = "p-3 rounded border bg-light";
                        updateTotal();
                        return;
                    }

                    selectedCustomerData = found;

                    const customerId = found.id ?? found.Id ?? "";
                    const customerName = found.hoTen ?? found.HoTen ?? "Khách hàng";
                    const customerPhone = found.soDienThoai ?? found.SoDienThoai ?? "";
                    const currentPoints = Number(found.diemTichLuy ?? found.DiemTichLuy ?? 0);

                    hiddenCustomer.value = customerId;
                    nameEl.textContent = customerName;
                    phoneEl.textContent = `SĐT: ${customerPhone}`;
                    pointEl.textContent = `Điểm tích lũy: ${currentPoints} điểm`;

                    if (pointHint) pointHint.textContent = "Nhập số điểm muốn dùng";
                    box.className = "p-3 rounded border bg-white";
                    box.style.borderColor = "#bbf7d0";

                    if (usedPointInput) {
                        usedPointInput.disabled = false;
                        usedPointInput.max = currentPoints;
                        usedPointInput.value = 0;
                        usedPointInput.oninput = handleUsedPointsChange;
                    }

                    updateTotal();
                } catch {
                    nameEl.textContent = "Lỗi kết nối khi tìm khách hàng.";
                    phoneEl.textContent = "";
                    pointEl.textContent = "";
                    box.className = "p-3 rounded border bg-light";
                }
            }, 300);
        });
    }

    if (usedPointInput) {
        usedPointInput.addEventListener("input", handleUsedPointsChange);
    }

    const productSearchInput = document.getElementById("productSearchInput");
    const productSearchResult = document.getElementById("productSearchResult");

    if (productSearchInput && productSearchResult) {
        let searchTimer = null;

        productSearchInput.addEventListener("input", () => {
            const keyword = productSearchInput.value.trim().toLowerCase();

            clearTimeout(searchTimer);
            searchTimer = setTimeout(() => {
                if (!keyword) {
                    productSearchResult.classList.add("d-none");
                    productSearchResult.innerHTML = "";
                    return;
                }

                const matches = allProducts.filter(sp =>
                    (sp.tenSanPham ?? sp.TenSanPham ?? "").toLowerCase().includes(keyword)
                ).slice(0, 8);

                if (matches.length === 0) {
                    productSearchResult.innerHTML = `
                        <div class="list-group-item text-muted">Không tìm thấy sản phẩm</div>
                    `;
                    productSearchResult.classList.remove("d-none");
                    return;
                }

                productSearchResult.innerHTML = matches.map(sp => {
                    const barcode = sp.maVach ?? sp.MaVach ?? "";
                    const ten = sp.tenSanPham ?? sp.TenSanPham ?? "Sản phẩm";
                    const price = sp.giaBan ?? sp.GiaBan ?? 0;

                    return `
                        <button type="button"
                                class="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                                onclick="selectProductBySearch('${barcode}')">
                            <div>
                                <div class="fw-semibold">${ten}</div>
                                <div class="small text-muted">${barcode}</div>
                            </div>
                            <span class="text-danger fw-bold">${formatCurrency(price)}</span>
                        </button>
                    `;
                }).join("");

                productSearchResult.classList.remove("d-none");
            }, 250);
        });

        document.addEventListener("click", (e) => {
            if (!productSearchInput.contains(e.target) && !productSearchResult.contains(e.target)) {
                productSearchResult.classList.add("d-none");
            }
        });
    }
});

async function loadProducts() {
    try {
        const res = await fetch("/api/SanPham");
        if (!res.ok) return;
        allProducts = await res.json();
    } catch {
        allProducts = [];
    }
}

function handleUsedPointsChange() {
    const input = document.getElementById("usedPointInput");
    if (!input || !selectedCustomerData) {
        usedPoints = 0;
        updateTotal();
        return;
    }

    const maxPoints = Number(selectedCustomerData.diemTichLuy ?? selectedCustomerData.DiemTichLuy ?? 0);
    let value = parseInt(input.value) || 0;

    if (value < 0) value = 0;
    if (value > maxPoints) value = maxPoints;

    input.value = value;
    usedPoints = value;
    updateTotal();
}

function getNhanVienId() {
    return parseInt(localStorage.getItem("staffId") || "1");
}

function toggleCamera() {
    if (isCameraOn) stopCamera();
    else startCamera();
}

function startCamera() {
    const cameraSection = document.getElementById("cameraSection");
    const cameraBtn = document.getElementById("cameraBtn");
    const scanIndicator = document.getElementById("scanIndicator");

    cameraSection.classList.remove("d-none");
    cameraBtn.textContent = "⏹ Tắt camera";
    cameraBtn.classList.add("active");
    scanIndicator?.classList.remove("d-none");

    html5QrcodeScanner = new Html5Qrcode("reader");

    Html5Qrcode.getCameras().then(cameras => {
        if (!cameras || cameras.length === 0) {
            showProductError("Không tìm thấy camera trên thiết bị.");
            stopCamera();
            return;
        }

        const cameraId = cameras[cameras.length - 1].id;

        let lastScanText = "";
        let lastScanTime = 0;

        html5QrcodeScanner.start(
            cameraId,
            { fps: 10, qrbox: { width: 220, height: 120 }, aspectRatio: 1.6 },
            async (decodedText) => {
                const now = Date.now();

                if (decodedText === lastScanText && now - lastScanTime < 1000) {
                    return;
                }

                lastScanText = decodedText;
                lastScanTime = now;

                const input = document.getElementById("barcodeInput");
                if (input) input.value = decodedText;

                await searchByBarcode();

                if (input) {
                    input.value = "";
                    input.focus();
                }
            },
            () => { }
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
        html5QrcodeScanner.stop().catch(() => { });
        html5QrcodeScanner = null;
    }

    isCameraOn = false;
    cameraSection.classList.add("d-none");
    cameraBtn.textContent = "📷 Bật camera";
    cameraBtn.classList.remove("active");
    scanIndicator?.classList.add("d-none");
}

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

        let data = null;
        try {
            data = await res.json();
        } catch {
            data = null;
        }

        if (!res.ok) {
            showProductError(data?.message || `Không tìm thấy: ${barcode}`);
            input.select();
            return;
        }

        await displayProduct(data);
        input.value = "";
        input.focus();
    } catch (err) {
        console.error("searchByBarcode error:", err);
        showProductError("Lỗi kết nối đến server.");
    }
}

async function selectProductBySearch(barcode) {
    const productSearchInput = document.getElementById("productSearchInput");
    const productSearchResult = document.getElementById("productSearchResult");

    if (productSearchInput) productSearchInput.value = "";
    if (productSearchResult) {
        productSearchResult.classList.add("d-none");
        productSearchResult.innerHTML = "";
    }

    if (!barcode) return;

    try {
        const res = await fetch(`/api/SanPham/mavach/${encodeURIComponent(barcode)}`);

        let data = null;
        try {
            data = await res.json();
        } catch {
            data = null;
        }

        if (!res.ok) {
            showProductError(data?.message || `Không tìm thấy: ${barcode}`);
            return;
        }

        await displayProduct(data);
    } catch (err) {
        console.error("selectProductBySearch error:", err);
        showProductError("Lỗi kết nối đến server.");
    }
}
async function displayProduct(data) {
    currentProduct = data;

    document.getElementById("productName").textContent = data.tenSanPham;
    document.getElementById("productBarcode").textContent = data.maVach;

    document.getElementById("productSaleBadge").classList.add("d-none");
    document.getElementById("productOriginalPrice").classList.add("d-none");
    document.getElementById("productSaleInfo").classList.add("d-none");

    document.getElementById("productPrice").textContent = formatCurrency(data.giaBan);
    currentProduct._giaThucTe = data.giaBan;
    currentProduct._khuyenMai = null;

    document.getElementById("productCard").classList.remove("d-none");
}

function showProductError(msg) {
    const el = document.getElementById("productError");
    el.textContent = msg;
    el.classList.remove("d-none");
}

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
    const afterProductDiscount = cart.reduce((s, i) => s + i.giaThucTe * i.soLuong, 0);
    const productDiscount = subtotal - afterProductDiscount;
    const pointDiscount = usedPoints * 70;
    let finalTotal = afterProductDiscount - pointDiscount;
    if (finalTotal < 0) finalTotal = 0;

    document.getElementById("totalItems").textContent = totalItems;
    document.getElementById("subtotalAmount").textContent = formatCurrency(subtotal);
    document.getElementById("totalAmount").textContent = formatCurrency(finalTotal);

    const discountRow = document.getElementById("discountRow");
    if (productDiscount > 0) {
        discountRow.style.removeProperty("display");
        document.getElementById("discountAmount").textContent = `- ${formatCurrency(productDiscount)}`;
    } else {
        discountRow.style.setProperty("display", "none", "important");
    }

    const pointRow = document.getElementById("pointDiscountRow");
    if (pointRow) {
        if (pointDiscount > 0) {
            pointRow.style.removeProperty("display");
            document.getElementById("pointDiscountAmount").textContent = `- ${formatCurrency(pointDiscount)}`;
        } else {
            pointRow.style.setProperty("display", "none", "important");
        }
    }

    document.getElementById("checkoutBtn").disabled = cart.length === 0;
}
function openCheckoutModal() {
    if (cart.length === 0) return;

    const subtotal = cart.reduce((s, i) => s + i.sanPham.giaBan * i.soLuong, 0);
    const afterProductDiscount = cart.reduce((s, i) => s + i.giaThucTe * i.soLuong, 0);
    const productDiscount = subtotal - afterProductDiscount;
    const pointDiscount = usedPoints * 70;
    const total = Math.max(0, afterProductDiscount - pointDiscount);

    document.getElementById("receiptItems").innerHTML = cart.map(item => `
        <div class="receipt-item">
            <span>
                ${item.sanPham.tenSanPham}
                <span class="text-muted">×${item.soLuong}</span>
            </span>
            <span class="fw-semibold">${formatCurrency(item.giaThucTe * item.soLuong)}</span>
        </div>
    `).join("");

    document.getElementById("modalSubtotal").textContent = formatCurrency(subtotal);
    document.getElementById("modalTotal").textContent = formatCurrency(total);

    const discRow = document.getElementById("modalDiscountRow");
    if (productDiscount > 0) {
        discRow.classList.remove("d-none");
        document.getElementById("modalDiscount").textContent = `- ${formatCurrency(productDiscount)}`;
    } else {
        discRow.classList.add("d-none");
    }

    const pointRow = document.getElementById("modalPointRow");
    if (pointRow) {
        if (pointDiscount > 0) {
            pointRow.classList.remove("d-none");
            document.getElementById("modalPointDiscount").textContent = `- ${formatCurrency(pointDiscount)}`;
        } else {
            pointRow.classList.add("d-none");
        }
    }

    selectPayment("TienMat", total);
    document.getElementById("tienKhachDua").value = "";
    document.getElementById("tienThua").textContent = "0 đ";
    document.getElementById("changeDisplay").className = "change-display";
    checkoutModal.show();
}
function selectPayment(method, total) {
    selectedPayment = method;

    document.getElementById("btnTienMat").classList.toggle("selected", method === "TienMat");
    document.getElementById("btnThe").classList.toggle("selected", method === "The");
    document.getElementById("cashSection").classList.toggle("d-none", method !== "TienMat");
    document.getElementById("cardSection").classList.toggle("d-none", method !== "The");

    if (method === "The") {
        const amount = (total !== undefined && total > 0) ? total : getFinalTotal();
        generateQRCode(amount);
    }
}

function generateQRCode(total) {
    const qrContainer = document.getElementById("qrCodeContainer");
    const qrAmountEl = document.getElementById("qrAmount");

    if (!qrContainer) return;
    if (!total || total <= 0) {
        qrContainer.innerHTML = `<div class="text-muted small text-center">Không có đơn hàng</div>`;
        return;
    }

    if (qrAmountEl) {
        qrAmountEl.textContent = formatCurrency(total);
    }

    const bankId = "MB";
    const accountNo = "0123456789";
    const accountName = "SIEU THI MINI";
    const addInfo = `THANH TOAN ${Date.now().toString().slice(-6)}`;

    const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png`
        + `?amount=${total}`
        + `&addInfo=${encodeURIComponent(addInfo)}`
        + `&accountName=${encodeURIComponent(accountName)}`;

    qrContainer.innerHTML = `<div class="text-center text-muted small py-2">⏳ Đang tải mã QR...</div>`;

    const img = new Image();
    img.alt = "QR Chuyển khoản";
    img.style.cssText = "width:200px;height:200px;border-radius:12px;border:3px solid #e5e7eb;display:block;margin:0 auto;";

    img.onload = () => {
        qrContainer.innerHTML = "";
        qrContainer.appendChild(img);
        const info = document.createElement("div");
        info.className = "text-center mt-2 small";
        info.innerHTML = `
            <div class="fw-bold text-dark">${accountName}</div>
            <div class="text-muted">${bankId} — ${accountNo}</div>
            <div class="text-muted" style="font-size:0.78rem">ND: ${addInfo}</div>
        `;
        qrContainer.appendChild(info);
    };

    img.onerror = () => {
        qrContainer.innerHTML = `
            <div class="text-center p-3" style="border:2px dashed #e5e7eb;border-radius:12px;">
                <div style="font-size:3rem;">📱</div>
                <div class="fw-bold mt-2">Chuyển khoản ngân hàng</div>
                <div class="text-muted small mt-1">Ngân hàng: <strong>${bankId}</strong></div>
                <div class="text-muted small">Số TK: <strong>${accountNo}</strong></div>
                <div class="text-muted small">Tên TK: <strong>${accountName}</strong></div>
                <div class="text-muted small">Nội dung: <strong>${addInfo}</strong></div>
                <div class="fw-bold text-danger mt-2 fs-5">${formatCurrency(total)}</div>
            </div>`;
    };

    img.src = qrUrl;
}

function getFinalTotal() {
    const afterProductDiscount = cart.reduce((s, i) => s + i.giaThucTe * i.soLuong, 0);
    const pointDiscount = usedPoints * 70;
    return Math.max(0, afterProductDiscount - pointDiscount);
}

function tinhTienThua() {
    const total = getFinalTotal();
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

async function confirmCheckout() {
    const total = getFinalTotal();
    const customerId = document.getElementById("customerSelect").value;
    const currentCustomerPoints = Number(selectedCustomerData?.diemTichLuy ?? selectedCustomerData?.DiemTichLuy ?? 0);
    const pointsToUse = Math.min(usedPoints || 0, currentCustomerPoints);

    if (selectedPayment === "TienMat") {
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

    try {
        const donHangRes = await fetch("/api/DonHang", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                NgayTao: new Date().toISOString(),
                TongTien: total,
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

        await Promise.all(cart.map(item =>
            fetch(`/api/DonHang/${donHang.id}/chitiet`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    SoLuong: item.soLuong,
                    DonGia: item.giaThucTe,
                    SanPhamId: item.sanPham.maSanPham
                })
            })
        ));

        const thanhToanRes = await fetch(`/api/DonHang/${donHang.id}/thanhtoan`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ PhuongThucThanhToan: selectedPayment })
        });

        if (!thanhToanRes.ok) throw new Error("Cập nhật trạng thái thanh toán thất bại");

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

        if (customerId && pointsToUse > 0) {
            await fetch(`/api/KhachHang/${customerId}/tru-diem`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ soDiem: pointsToUse })
            });
        }

        checkoutModal.hide();

        const phuongThucLabel = selectedPayment === "TienMat" ? "Tiền mặt" : "Thẻ/Chuyển khoản";
        showCheckoutSuccess(donHang.id, total, phuongThucLabel);

        cart = [];
        usedPoints = 0;
        selectedCustomerData = null;

        const customerInput = document.getElementById("customerSearchInput");
        if (customerInput) customerInput.value = "";

        const customerSelect = document.getElementById("customerSelect");
        if (customerSelect) customerSelect.value = "";

        const nameEl = document.getElementById("selectedCustomerName");
        const phoneEl = document.getElementById("selectedCustomerPhone");
        const pointEl = document.getElementById("selectedCustomerPoint");
        const pointHint = document.getElementById("pointHint");
        if (nameEl) nameEl.textContent = "Chưa chọn khách hàng";
        if (phoneEl) phoneEl.textContent = "";
        if (pointEl) pointEl.textContent = "";
        if (pointHint) pointHint.textContent = "Chọn khách hàng để dùng điểm";

        const usedPointInput = document.getElementById("usedPointInput");
        if (usedPointInput) {
            usedPointInput.value = 0;
            usedPointInput.disabled = true;
        }

        renderCart();
        updateTotal();

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

function formatCurrency(amount) {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount || 0);
}