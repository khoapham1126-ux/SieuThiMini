/**
 * tonkho.js — Tồn kho theo lô hàng
 * API:
 *   GET /api/LoHang  → { Id, NgayNhap, HanSuDung, SoLuongNhap, SanPhamId, GiaNhap, LoaiDonVi }
 *   GET /api/SanPham → { maSanPham, tenSanPham, ... }
 */

const API_LO_HANG = "/api/LoHang";
const API_SAN_PHAM = "/api/SanPham";

let allData = [];   // danh sách lô hàng
let sanPhamMap = {};   // { maSanPham: tenSanPham } — tra cứu nhanh
let filteredData = [];

document.addEventListener("DOMContentLoaded", () => {
    loadData();
});

// ── TẢI DỮ LIỆU ──────────────────────────────────────────────
async function loadData() {
    try {
        // Gọi song song cả 2 API
        const [resLo, resSP] = await Promise.all([
            fetch(API_LO_HANG),
            fetch(API_SAN_PHAM)
        ]);

        if (!resLo.ok) throw new Error(`Lỗi LoHang: ${resLo.status}`);
        if (!resSP.ok) throw new Error(`Lỗi SanPham: ${resSP.status}`);

        const loData = await resLo.json();
        const spData = await resSP.json();

        // Tạo map tra cứu tên SP: { 1: "Áo thun", 2: "Quần jean", ... }
        sanPhamMap = {};
        spData.forEach(sp => {
            sanPhamMap[sp.maSanPham] = sp.tenSanPham;
        });

        allData = loData;
        filterLo();
        renderStats();

    } catch (err) {
        document.getElementById("inventoryAlert").classList.remove("d-none");
        document.getElementById("inventoryAlert").textContent = "Không tải được dữ liệu: " + err.message;
        document.getElementById("inventoryBody").innerHTML =
            `<tr><td colspan="9" class="text-center py-4 text-danger">Lỗi tải dữ liệu</td></tr>`;
    }
}

// ── TÍNH SỐ NGÀY CÒN LẠI ─────────────────────────────────────
function soNgayConLai(hanSuDung) {
    if (!hanSuDung) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const han = new Date(hanSuDung);
    han.setHours(0, 0, 0, 0);
    return Math.floor((han - today) / (1000 * 60 * 60 * 24));
}

// ── PHÂN LOẠI HẠN ─────────────────────────────────────────────
function phanLoaiHan(ngay) {
    if (ngay === null) return "ok";
    if (ngay <= 0) return "het";
    if (ngay <= 30) return "sap";
    return "ok";
}

// ── FILTER ───────────────────────────────────────────────────
function filterLo() {
    const searchMaLo = document.getElementById("searchMaLo").value.trim().toLowerCase();
    const searchMaSP = document.getElementById("searchMaSP").value.trim().toLowerCase();
    const searchTenSP = document.getElementById("searchTenSP").value.trim().toLowerCase();
    const hanFilter = document.getElementById("hanFilter").value;

    filteredData = allData.filter(lo => {
        // Tìm theo mã lô
        const matchMaLo = !searchMaLo || String(lo.id).includes(searchMaLo);

        // Tìm theo mã sản phẩm
        const matchMaSP = !searchMaSP || String(lo.sanPhamId).includes(searchMaSP);

        // Tìm theo tên sản phẩm
        const tenSP = (sanPhamMap[lo.sanPhamId] || "").toLowerCase();
        const matchTenSP = !searchTenSP || tenSP.includes(searchTenSP);

        // Lọc theo hạn
        const ngay = soNgayConLai(lo.hanSuDung);
        const loaiHan = phanLoaiHan(ngay);
        const matchHan = !hanFilter || loaiHan === hanFilter;

        return matchMaLo && matchMaSP && matchTenSP && matchHan;
    });

    // Sắp xếp: hết hạn / sắp hết hạn lên trên
    filteredData.sort((a, b) => {
        const ngayA = soNgayConLai(a.hanSuDung) ?? 9999;
        const ngayB = soNgayConLai(b.hanSuDung) ?? 9999;
        return ngayA - ngayB;
    });

    renderTable();
    document.getElementById("filterInfo").textContent =
        `Hiển thị ${filteredData.length} / ${allData.length} lô hàng`;
}

function resetFilter() {
    document.getElementById("searchMaLo").value = "";
    document.getElementById("searchMaSP").value = "";
    document.getElementById("searchTenSP").value = "";
    document.getElementById("hanFilter").value = "";
    filterLo();
}

// ── RENDER BẢNG ──────────────────────────────────────────────
function renderTable() {
    const tbody = document.getElementById("inventoryBody");
    const maxQty = Math.max(...allData.map(l => l.soLuongNhap), 1);

    if (filteredData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center py-4 text-muted">Không có lô hàng nào</td></tr>`;
        return;
    }

    tbody.innerHTML = filteredData.map(lo => {
        const ngay = soNgayConLai(lo.hanSuDung);
        const loaiHan = phanLoaiHan(ngay);

        // Màu cột hạn sử dụng
        const hanClass = loaiHan === "het" ? "han-het"
            : loaiHan === "sap" && ngay <= 7 ? "han-do"
                : loaiHan === "sap" ? "han-cam"
                    : "han-binh-thuong";

        // Badge tình trạng hạn
        const badge = loaiHan === "het"
            ? `<span class="badge badge-het-han">Hết hạn</span>`
            : loaiHan === "sap" && ngay <= 7
                ? `<span class="badge badge-gan-het-han">🔴 Còn ${ngay} ngày</span>`
                : loaiHan === "sap"
                    ? `<span class="badge badge-sap-het-han">⚠ Còn ${ngay} ngày</span>`
                    : `<span class="badge badge-binh-thuong">Còn hạn</span>`;

        // Màu + thanh số lượng
        const qtyClass = lo.soLuongNhap < 10 ? "qty-low" : "";
        const barClass = lo.soLuongNhap <= 0 ? "bar-low"
            : lo.soLuongNhap < 10 ? "bar-low"
                : lo.soLuongNhap < 30 ? "bar-mid" : "bar-ok";
        const barWidth = lo.soLuongNhap <= 0 ? 2
            : Math.round((lo.soLuongNhap / maxQty) * 100);

        // Tên sản phẩm từ map
        const tenSP = sanPhamMap[lo.sanPhamId] || `SP #${lo.sanPhamId}`;

        return `
        <tr>
            <td class="text-muted small fw-semibold">#${lo.id}</td>
            <td class="text-muted small">${lo.sanPhamId}</td>
            <td class="fw-semibold">${tenSP}</td>
            <td class="small">${formatDate(lo.ngayNhap)}</td>
            <td class="small ${hanClass}">${formatDate(lo.hanSuDung)}</td>
            <td class="text-end">${formatVND(lo.giaNhap)}</td>
            <td>
                <div class="qty-bar-wrap">
                    <span class="${qtyClass}">${lo.soLuongNhap}</span>
                    <div class="qty-bar">
                        <div class="qty-bar-fill ${barClass}" style="width:${barWidth}%"></div>
                    </div>
                </div>
            </td>
            <td class="text-muted small">${lo.loaiDonVi || "—"}</td>
            <td class="text-center">${badge}</td>
        </tr>`;
    }).join("");
}

// ── RENDER STATS ─────────────────────────────────────────────
function renderStats() {
    const total = allData.length;
    const sapHetHan = allData.filter(l => phanLoaiHan(soNgayConLai(l.hanSuDung)) === "sap").length;
    const hetHan = allData.filter(l => phanLoaiHan(soNgayConLai(l.hanSuDung)) === "het").length;
    const ok = total - sapHetHan - hetHan;

    document.getElementById("statTotal").textContent = total;
    document.getElementById("statOk").textContent = ok;
    document.getElementById("statSapHetHan").textContent = sapHetHan;
    document.getElementById("statHetHan").textContent = hetHan;
}

// ── HELPERS ──────────────────────────────────────────────────
function formatDate(str) {
    if (!str) return "—";
    return new Date(str).toLocaleDateString("vi-VN");
}

function formatVND(n) {
    if (!n && n !== 0) return "—";
    return n.toLocaleString("vi-VN") + "đ";
}