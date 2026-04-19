/**
 * phieunhap.js — Trang nhập hàng
 *
 * API:
 *   GET  /api/NhaCungCap  → { id, ten, diaChi, soDienThoai, email }
 *   GET  /api/SanPham     → { maSanPham, tenSanPham, maVach, giaBan, giaVon, ... }
 *   POST /api/PhieuNhap?sanPhamId=...&soLuong=...
 *   GET  /api/PhieuNhap
 */

document.addEventListener("DOMContentLoaded", () => {
    setDefaultNgayNhap();
    loadNhaCungCap();
    loadSanPham();
    loadLichSu();
});

// ── SET NGÀY NHẬP MẶC ĐỊNH = BÂY GIỜ ────────────────────────
function setDefaultNgayNhap() {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString().slice(0, 16);
    document.getElementById("ngayNhap").value = local;
}

// ── LOAD NHÀ CUNG CẤP ────────────────────────────────────────
async function loadNhaCungCap() {
    const sel = document.getElementById("nhaCungCapId");
    try {
        const res = await fetch("/api/NhaCungCap");
        if (!res.ok) throw new Error();
        const data = await res.json();

        if (!data || data.length === 0) {
            sel.innerHTML = `<option value="">-- Chưa có nhà cung cấp --</option>`;
            return;
        }
        sel.innerHTML = `<option value="">-- Chọn nhà cung cấp --</option>` +
            data.map(n => `<option value="${n.id}">${n.ten ?? n.Ten ?? "(không tên)"}</option>`).join("");

    } catch {
        sel.innerHTML = `<option value="">-- Lỗi tải nhà cung cấp --</option>`;
    }
}

// ── LOAD SẢN PHẨM ────────────────────────────────────────────
async function loadSanPham() {
    const sel = document.getElementById("sanPhamId");
    try {
        const res = await fetch("/api/SanPham");
        if (!res.ok) throw new Error();
        const data = await res.json();

        if (!data || data.length === 0) {
            sel.innerHTML = `<option value="">-- Chưa có sản phẩm --</option>`;
            return;
        }

        sel.innerHTML = `<option value="">-- Chọn sản phẩm --</option>` +
            data.map(p => `<option value="${p.maSanPham}" data-gia="${p.giaVon}">
                ${p.tenSanPham}
            </option>`).join("");

    } catch {
        sel.innerHTML = `<option value="">-- Lỗi tải sản phẩm --</option>`;
    }
}

// ── KHI CHỌN SẢN PHẨM → tự điền giaVon vào đơn giá ─────────
function onSanPhamChange() {
    const sel = document.getElementById("sanPhamId");
    const opt = sel.options[sel.selectedIndex];
    const gia = opt ? (opt.getAttribute("data-gia") || 0) : 0;
    if (gia > 0) {
        document.getElementById("donGia").value = gia;
        tinhTongTien();
    }
}

// ── TÍNH TỔNG TIỀN ───────────────────────────────────────────
function tinhTongTien() {
    const soLuong = parseInt(document.getElementById("soLuong").value) || 0;
    const donGia = parseInt(document.getElementById("donGia").value) || 0;
    const tong = soLuong * donGia;
    document.getElementById("tongTienHienThi").textContent = tong.toLocaleString("vi-VN") + "đ";
    return tong;
}

// ── SUBMIT PHIẾU NHẬP ────────────────────────────────────────
async function submitPhieuNhap() {
    const sanPhamId = parseInt(document.getElementById("sanPhamId").value);
    const soLuong = parseInt(document.getElementById("soLuong").value);
    const donGia = parseInt(document.getElementById("donGia").value);
    const nhaCungCapId = parseInt(document.getElementById("nhaCungCapId").value);
    const ngayNhap = document.getElementById("ngayNhap").value;
    const nhanVienId = parseInt(localStorage.getItem("nhanVienId") || "1");

    if (!sanPhamId) return showAlert("danger", "Vui lòng chọn sản phẩm!");
    if (!soLuong || soLuong < 1) return showAlert("danger", "Số lượng phải lớn hơn 0!");
    if (!donGia || donGia < 1) return showAlert("danger", "Đơn giá phải lớn hơn 0!");
    if (!nhaCungCapId) return showAlert("danger", "Vui lòng chọn nhà cung cấp!");

    const tongTien = soLuong * donGia;
    const btn = document.getElementById("btnNhap");
    btn.disabled = true;
    btn.textContent = "Đang xử lý...";

    try {
        const url = `/api/PhieuNhap?sanPhamId=${sanPhamId}&soLuong=${soLuong}`;

        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: 0,
                ngayNhap: new Date(ngayNhap).toISOString(),
                tongTien: tongTien,
                nhaCungCapId: nhaCungCapId,
                nhanVienId: nhanVienId
            })
        });

        if (!res.ok) throw new Error(`Lỗi ${res.status}`);

        showAlert("success", "✅ Nhập hàng thành công! Tồn kho đã được cập nhật.");
        resetForm();
        loadLichSu();

    } catch (err) {
        showAlert("danger", "Nhập hàng thất bại: " + err.message);
    } finally {
        btn.disabled = false;
        btn.textContent = "Xác nhận nhập hàng";
    }
}

// ── LOAD LỊCH SỬ ─────────────────────────────────────────────
async function loadLichSu() {
    const tbody = document.getElementById("lichSuBody");
    try {
        const res = await fetch("/api/PhieuNhap");
        if (!res.ok) throw new Error();
        const data = await res.json();

        if (!data || data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" class="text-center text-muted py-3">Chưa có phiếu nhập</td></tr>`;
            return;
        }

        const recent = [...data].reverse().slice(0, 10);
        tbody.innerHTML = recent.map(p => `
            <tr>
                <td class="text-muted small">#${p.id}</td>
                <td class="small">${formatDate(p.ngayNhap)}</td>
                <td class="text-end fw-semibold">${(p.tongTien || 0).toLocaleString("vi-VN")}đ</td>
            </tr>`).join("");

    } catch {
        tbody.innerHTML = `<tr><td colspan="3" class="text-center text-muted py-3">Không tải được lịch sử</td></tr>`;
    }
}

// ── RESET FORM ───────────────────────────────────────────────
function resetForm() {
    document.getElementById("sanPhamId").value = "";
    document.getElementById("soLuong").value = "";
    document.getElementById("donGia").value = "";
    document.getElementById("tongTienHienThi").textContent = "0đ";
    setDefaultNgayNhap();
}

// ── HELPERS ──────────────────────────────────────────────────
function showAlert(type, msg) {
    const el = document.getElementById("formAlert");
    el.className = `alert alert-${type}`;
    el.textContent = msg;
    el.classList.remove("d-none");
    setTimeout(() => el.classList.add("d-none"), 4000);
}

function formatDate(str) {
    if (!str) return "—";
    const d = new Date(str);
    return d.toLocaleDateString("vi-VN") + " " +
        d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}