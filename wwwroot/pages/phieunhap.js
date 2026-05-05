

const LOAI_DON_VI = ["Cái", "Thùng", "Hộp", "Kg", "Lít", "Gói", "Bộ"];

let dsSanPham = [];   // cache sản phẩm từ API
let soThuTu = 0;    // đếm id dòng SP

// ── KHỞI ĐỘNG ────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    loadNhaCungCap();
    loadSanPham();
    loadLichSu();
    themDongSP(); // thêm 1 dòng sản phẩm mặc định
});

// ── LOAD NHÀ CUNG CẤP ────────────────────────────────────────
async function loadNhaCungCap() {
    const sel = document.getElementById("nhaCungCapId");
    try {
        const res = await fetch("/api/NhaCungCap");
        const data = await res.json();
        if (!data || data.length === 0) {
            sel.innerHTML = `<option value="">-- Chưa có nhà cung cấp --</option>`;
            return;
        }
        sel.innerHTML = `<option value="">-- Chọn nhà cung cấp --</option>` +
            data.map(n => `<option value="${n.id}">${n.ten || n.Ten || n.tenNhaCungCap || "NCC #" + n.id}</option>`).join("");

        // Khi đổi NCC → cập nhật lại tất cả dropdown SP
        sel.addEventListener("change", () => {
            document.querySelectorAll(".sp-select").forEach(s => fillSPOptions(s));
        });
    } catch {
        sel.innerHTML = `<option value="">-- Lỗi tải nhà cung cấp --</option>`;
    }
}

// ── LOAD SẢN PHẨM ────────────────────────────────────────────
async function loadSanPham() {
    try {
        const res = await fetch("/api/SanPham");
        dsSanPham = await res.json();
        // Cập nhật tất cả dropdown SP đang có
        document.querySelectorAll(".sp-select").forEach(sel => fillSPOptions(sel));
    } catch {
        dsSanPham = [];
    }
}

function fillSPOptions(sel) {
    const currentVal = sel.value;
    const nccId = parseInt(document.getElementById("nhaCungCapId")?.value) || 0;

    // Lọc SP theo NCC nếu đã chọn NCC, nếu chưa chọn thì hiện tất cả
    const dsDuLoc = nccId
        ? dsSanPham.filter(p => p.maNhaCungCap === nccId)
        : dsSanPham;

    sel.innerHTML = `<option value="">-- Chọn sản phẩm --</option>` +
        dsDuLoc.map(p =>
            `<option value="${p.maSanPham}" data-giavon="${p.giaVon}" data-donvi="${p.donViTinh || ''}">${p.tenSanPham}</option>`
        ).join("");
    if (currentVal) sel.value = currentVal;
}

// ── THÊM DÒNG SẢN PHẨM ───────────────────────────────────────
function themDongSP() {
    soThuTu++;
    const id = soThuTu;
    const div = document.createElement("div");
    div.className = "sp-row";
    div.id = `sp-row-${id}`;

    div.innerHTML = `
        <button class="btn-remove-sp" onclick="xoaDongSP(${id})" title="Xoá">✕</button>
        <div class="row g-2">
            <!-- Sản phẩm -->
            <div class="col-md-12 mb-1">
                <label class="form-label mb-1">Sản phẩm</label>
                <select class="form-select form-select-sm sp-select" id="sp-id-${id}"
                        onchange="onChonSP(${id})">
                    <option value="">-- Chọn sản phẩm --</option>
                </select>
            </div>
            <!-- Số lượng -->
            <div class="col-4">
                <label class="form-label mb-1">Số lượng</label>
                <input type="number" class="form-control form-control-sm sp-soluong"
                       id="sp-sl-${id}" min="1" placeholder="0" oninput="tinhTongTien()">
            </div>
            <!-- Giá nhập -->
            <div class="col-4">
                <label class="form-label mb-1">Giá nhập (đ)</label>
                <input type="number" class="form-control form-control-sm sp-dongia"
                       id="sp-gia-${id}" min="0" placeholder="0" oninput="tinhTongTien()">
            </div>
            <!-- Loại đơn vị -->
            <div class="col-4">
                <label class="form-label mb-1">Đơn vị</label>
                <select class="form-select form-select-sm" id="sp-donvi-${id}">
                    <option value="">-- Chọn SP trước --</option>
                </select>
            </div>
            <!-- Hạn sử dụng -->
            <div class="col-6 mt-1">
                <label class="form-label mb-1">Hạn sử dụng <span class="text-danger">*</span></label>
                <input type="date" class="form-control form-control-sm sp-han" id="sp-han-${id}">
            </div>
            <!-- Thành tiền -->
            <div class="col-6 mt-1 d-flex align-items-end">
                <div class="w-100 text-end">
                    <span class="text-muted small">Thành tiền: </span>
                    <span class="fw-bold text-danger sp-thanhtien" id="sp-tt-${id}">0đ</span>
                </div>
            </div>
        </div>`;

    document.getElementById("spList").appendChild(div);
    fillSPOptions(document.getElementById(`sp-id-${id}`));
}

function xoaDongSP(id) {
    const row = document.getElementById(`sp-row-${id}`);
    if (row) row.remove();
    tinhTongTien();
}

// ── KHI CHỌN SẢN PHẨM → tự điền giaVon + build dropdown donViTinh ──
function onChonSP(id) {
    const sel = document.getElementById(`sp-id-${id}`);
    const opt = sel.options[sel.selectedIndex];
    const gia = opt ? (opt.getAttribute("data-giavon") || 0) : 0;
    const donVi = opt ? (opt.getAttribute("data-donvi") || "") : "";

    if (gia > 0) {
        document.getElementById(`sp-gia-${id}`).value = gia;
        tinhTongTien();
    }

    // Split "Thùng,Hộp,Cái" → dropdown
    const donViEl = document.getElementById(`sp-donvi-${id}`);
    if (donViEl) {
        const dsdonVi = donVi.split(",").map(v => v.trim()).filter(v => v);
        if (dsdonVi.length > 0) {
            donViEl.innerHTML = dsdonVi.map(v => `<option value="${v}">${v}</option>`).join("");
        } else {
            donViEl.innerHTML = `<option value="">-- Không có đơn vị --</option>`;
        }
    }
}

// ── TÍNH TỔNG TIỀN ───────────────────────────────────────────
function tinhTongTien() {
    let tong = 0;
    document.querySelectorAll(".sp-row").forEach(row => {
        const id = row.id.replace("sp-row-", "");
        const sl = parseInt(document.getElementById(`sp-sl-${id}`)?.value) || 0;
        const gia = parseInt(document.getElementById(`sp-gia-${id}`)?.value) || 0;
        const tt = sl * gia;
        tong += tt;
        const ttEl = document.getElementById(`sp-tt-${id}`);
        if (ttEl) ttEl.textContent = tt.toLocaleString("vi-VN") + "đ";
    });
    document.getElementById("tongTienHienThi").textContent = tong.toLocaleString("vi-VN") + "đ";
}

// ── SUBMIT PHIẾU NHẬP ────────────────────────────────────────
async function submitPhieuNhap() {
    const nhaCungCapId = parseInt(document.getElementById("nhaCungCapId").value);
    const nhanVienId = parseInt(localStorage.getItem("nhanVienId") || "1");

    if (!nhaCungCapId) return showAlert("danger", "Vui lòng chọn nhà cung cấp!");

    // Thu thập danh sách sản phẩm
    const chiTiet = [];
    let valid = true;

    document.querySelectorAll(".sp-row").forEach(row => {
        if (!valid) return;
        const id = row.id.replace("sp-row-", "");
        const spId = parseInt(document.getElementById(`sp-id-${id}`)?.value);
        const soLuong = parseInt(document.getElementById(`sp-sl-${id}`)?.value);
        const giaNhap = parseInt(document.getElementById(`sp-gia-${id}`)?.value);
        const han = document.getElementById(`sp-han-${id}`)?.value;
        const donVi = document.getElementById(`sp-donvi-${id}`)?.value || "Cái";

        if (!spId) { showAlert("danger", "Vui lòng chọn sản phẩm cho tất cả các dòng!"); valid = false; return; }
        if (!soLuong || soLuong < 1) { showAlert("danger", "Số lượng phải lớn hơn 0!"); valid = false; return; }
        if (!giaNhap || giaNhap < 1) { showAlert("danger", "Giá nhập phải lớn hơn 0!"); valid = false; return; }
        if (!han) { showAlert("danger", "Vui lòng nhập hạn sử dụng!"); valid = false; return; }

        chiTiet.push({
            sanPhamId: spId,
            soLuong: soLuong,
            giaNhap: giaNhap,
            hanSuDung: new Date(han).toISOString(),
            loaiDonVi: donVi
        });
    });

    if (!valid) return;
    if (chiTiet.length === 0) return showAlert("danger", "Vui lòng thêm ít nhất 1 sản phẩm!");

    const btn = document.getElementById("btnNhap");
    btn.disabled = true;
    btn.textContent = "Đang xử lý...";

    try {
        const res = await fetch("/api/PhieuNhap", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nhaCungCapId, nhanVienId, chiTiet })
        });

        const result = await res.json();
        if (!res.ok) throw new Error(result.message || `Lỗi ${res.status}`);

        showAlert("success", `✅ Tạo phiếu nhập #${result.phieuNhapId} thành công! Tổng tiền: ${Number(result.tongTien).toLocaleString("vi-VN")}đ`);
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
            tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-3">Chưa có phiếu nhập</td></tr>`;
            return;
        }

        tbody.innerHTML = data.slice(0, 10).map(p => `
            <tr>
                <td class="text-muted small">#${p.id}</td>
                <td class="small">${formatDate(p.ngayNhap)}</td>
                <td class="text-end fw-semibold">${Number(p.tongTien || 0).toLocaleString("vi-VN")}đ</td>
                <td class="text-center">
                    <button class="btn-chitiet" onclick="xemChiTiet(${p.id})">Xem</button>
                </td>
            </tr>`).join("");

    } catch {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-3">Không tải được lịch sử</td></tr>`;
    }
}

// ── XEM CHI TIẾT PHIẾU NHẬP ──────────────────────────────────
async function xemChiTiet(id) {
    document.getElementById("modalTitle").textContent = `Chi tiết phiếu nhập #${id}`;
    document.getElementById("modalBody").innerHTML = `<div class="text-center text-muted py-4">Đang tải...</div>`;

    const modal = new bootstrap.Modal(document.getElementById("modalChiTiet"));
    modal.show();

    try {
        const res = await fetch(`/api/PhieuNhap/${id}/chitiet`);
        if (!res.ok) throw new Error(`Lỗi ${res.status}`);
        const data = await res.json();

        const { phieu, chiTiet } = data;

        document.getElementById("modalBody").innerHTML = `
            <!-- Thông tin phiếu -->
            <div class="row g-2 mb-3 p-3" style="background:#f9fafb;border-radius:10px">
                <div class="col-6">
                    <div class="text-muted small">Ngày nhập</div>
                    <div class="fw-semibold">${formatDate(phieu.ngayNhap)}</div>
                </div>
                <div class="col-6">
                    <div class="text-muted small">Tổng tiền</div>
                    <div class="fw-bold text-danger">${Number(phieu.tongTien || 0).toLocaleString("vi-VN")}đ</div>
                </div>
            </div>

            <!-- Danh sách sản phẩm -->
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0 table-modern">
                    <thead>
                        <tr>
                            <th>Sản phẩm</th>
                            <th class="text-center">Số lượng</th>
                            <th class="text-end">Đơn giá</th>
                            <th class="text-end">Thành tiền</th>
                            <th class="text-center">Lô hàng</th>
                            <th class="text-center">Hạn SD</th>
                            <th class="text-center">Đơn vị</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${chiTiet.map(c => `
                        <tr>
                            <td>
                                <div class="fw-semibold">${c.tenSanPham || "—"}</div>
                                <div class="text-muted small">SP #${c.sanPhamId}</div>
                            </td>
                            <td class="text-center">${c.soLuong}</td>
                            <td class="text-end">${Number(c.donGia).toLocaleString("vi-VN")}đ</td>
                            <td class="text-end fw-semibold text-danger">${Number(c.thanhTien).toLocaleString("vi-VN")}đ</td>
                            <td class="text-center text-muted small">${c.loHang ? `#${c.loHang.id}` : "—"}</td>
                            <td class="text-center small">${c.loHang ? formatDate(c.loHang.hanSuDung) : "—"}</td>
                            <td class="text-center small">${c.loHang?.loaiDonVi || "—"}</td>
                        </tr>`).join("")}
                    </tbody>
                </table>
            </div>`;

    } catch (err) {
        document.getElementById("modalBody").innerHTML =
            `<div class="text-center text-danger py-4">Không tải được chi tiết: ${err.message}</div>`;
    }
}

// ── RESET FORM ───────────────────────────────────────────────
function resetForm() {
    document.getElementById("nhaCungCapId").value = "";
    document.getElementById("spList").innerHTML = "";
    document.getElementById("tongTienHienThi").textContent = "0đ";
    soThuTu = 0;
    themDongSP(); // thêm lại 1 dòng trống
}

// ── HELPERS ──────────────────────────────────────────────────
function showAlert(type, msg) {
    const el = document.getElementById("formAlert");
    el.className = `alert alert-${type}`;
    el.textContent = msg;
    el.classList.remove("d-none");
    setTimeout(() => el.classList.add("d-none"), 5000);
}

function formatDate(str) {
    if (!str) return "—";
    return new Date(str).toLocaleDateString("vi-VN");
}