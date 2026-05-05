/**
 * sanpham.js — Trang Sản Phẩm
 * Đặt trong: wwwroot/pages/sanpham.js
 *
 * API:
 *   GET  /api/SanPham
 *   POST /api/SanPham
 *   GET  /api/DanhMuc
 *   GET  /api/NhaCungCap
 */

let allSP = [];
let filteredSP = [];
let danhMucMap = {}; // { id: ten }
let danhMucMota = {}; // { id: mota }
let modalThem = null;

document.addEventListener("DOMContentLoaded", () => {
    loadDanhMuc();
    loadNhaCungCap();
    loadSanPham();
    modalThem = new bootstrap.Modal(document.getElementById("modalThem"));
});

// ── LOAD DỮ LIỆU ─────────────────────────────────────────────
async function loadSanPham() {
    try {
        const res = await fetch("/api/SanPham");
        if (!res.ok) throw new Error(`Lỗi ${res.status}`);
        allSP = await res.json();
        filterSP();
        renderStats();
    } catch (err) {
        showAlert("spAlert", "danger", "Không tải được sản phẩm: " + err.message);
        document.getElementById("spBody").innerHTML =
            `<tr><td colspan="8" class="text-center py-4 text-danger">Lỗi tải dữ liệu</td></tr>`;
    }
}

async function loadDanhMuc() {
    try {
        const res = await fetch("/api/DanhMuc");
        const data = await res.json();

        // Map tra cứu nhanh
        danhMucMap = {};
        danhMucMota = {};
        data.forEach(d => {
            danhMucMap[d.id] = d.ten;
            danhMucMota[d.id] = d.mota;
        });

        // Dropdown filter
        const filterSel = document.getElementById("danhMucFilter");
        data.forEach(d => {
            const opt = document.createElement("option");
            opt.value = d.id;
            opt.textContent = d.ten;
            filterSel.appendChild(opt);
        });

        // Dropdown form thêm
        const formSel = document.getElementById("f-danhmuc");
        data.forEach(d => {
            const opt = document.createElement("option");
            opt.value = d.id;
            opt.textContent = d.ten;
            formSel.appendChild(opt);
        });

        // Cập nhật stat danh mục
        document.getElementById("statDanhMuc").textContent = data.length;

    } catch {
        document.getElementById("statDanhMuc").textContent = "—";
    }
}

async function loadNhaCungCap() {
    try {
        const res = await fetch("/api/NhaCungCap");
        const data = await res.json();
        const sel = document.getElementById("f-ncc");
        sel.innerHTML = `<option value="">-- Chọn nhà cung cấp --</option>` +
            data.map(n => `<option value="${n.id}">${n.ten || n.Ten || "NCC #" + n.id}</option>`).join("");
    } catch { }
}

// ── FILTER ───────────────────────────────────────────────────
function filterSP() {
    const search = document.getElementById("searchInput").value.trim().toLowerCase();
    const danhMuc = document.getElementById("danhMucFilter").value;
    const status = document.getElementById("statusFilter").value;

    filteredSP = allSP.filter(p => {
        const matchSearch = !search ||
            (p.tenSanPham || "").toLowerCase().includes(search) ||
            (p.maVach || "").toLowerCase().includes(search);
        const matchDanhMuc = !danhMuc || String(p.maDanhMuc) === String(danhMuc);
        const matchStatus = !status ||
            (status === "active" && p.trangthai) ||
            (status === "inactive" && !p.trangthai);
        return matchSearch && matchDanhMuc && matchStatus;
    });

    renderTable();
    document.getElementById("visibleCount").textContent = filteredSP.length;
    document.getElementById("filterInfo").textContent =
        `Hiển thị ${filteredSP.length} / ${allSP.length} sản phẩm`;
}

function resetFilter() {
    document.getElementById("searchInput").value = "";
    document.getElementById("danhMucFilter").value = "";
    document.getElementById("statusFilter").value = "";
    filterSP();
}

// ── RENDER BẢNG ──────────────────────────────────────────────
function renderTable() {
    const tbody = document.getElementById("spBody");

    if (filteredSP.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">Không tìm thấy sản phẩm nào</td></tr>`;
        return;
    }

    tbody.innerHTML = filteredSP.map(p => {
        const badge = p.trangthai
            ? `<span class="badge badge-active">Đang KD</span>`
            : `<span class="badge badge-inactive">Ngừng KD</span>`;

        const tenDanhMuc = danhMucMap[p.maDanhMuc] || `DM #${p.maDanhMuc}`;

        return `
        <tr>
            <td class="text-muted small fw-semibold">#${p.maSanPham}</td>
            <td class="fw-semibold">${p.tenSanPham || "—"}</td>
            <td class="small text-muted">${p.maVach || "—"}</td>
            <td><span class="badge bg-secondary bg-opacity-10 text-secondary">${tenDanhMuc}</span></td>
            <td class="small">${p.donViTinh || "—"}</td>
            <td class="text-end">${formatVND(p.giaVon)}</td>
            <td class="text-end fw-semibold text-danger">${formatVND(p.giaBan)}</td>
            <td class="text-center">${badge}</td>
        </tr>`;
    }).join("");
}

// ── RENDER STATS ─────────────────────────────────────────────
function renderStats() {
    document.getElementById("statTotal").textContent = allSP.length;
    document.getElementById("statActive").textContent = allSP.filter(p => p.trangthai).length;
    document.getElementById("statInactive").textContent = allSP.filter(p => !p.trangthai).length;
}

// ── MỞ MODAL THÊM ────────────────────────────────────────────
function moModalThem() {
    // Reset form
    document.getElementById("f-ten").value = "";
    document.getElementById("f-mavach").value = "";
    document.getElementById("f-danhmuc").value = "";
    document.getElementById("f-ncc").value = "";
    document.getElementById("f-giavon").value = "";
    document.getElementById("f-giaban").value = "";
    document.getElementById("f-donvi").value = "";
    document.getElementById("f-trangthai").checked = true;
    document.getElementById("modalAlert").classList.add("d-none");
    modalThem.show();
}

// ── LƯU SẢN PHẨM ─────────────────────────────────────────────
async function luuSanPham() {
    const ten = document.getElementById("f-ten").value.trim();
    const maVach = document.getElementById("f-mavach").value.trim();
    const maDanhMuc = parseInt(document.getElementById("f-danhmuc").value);
    const maNCC = parseInt(document.getElementById("f-ncc").value);
    const giaVon = parseInt(document.getElementById("f-giavon").value);
    const giaBan = parseInt(document.getElementById("f-giaban").value);
    const donViTinh = document.getElementById("f-donvi").value.trim();
    const trangthai = document.getElementById("f-trangthai").checked;

    // Validate
    if (!ten) return showAlert("modalAlert", "danger", "Vui lòng nhập tên sản phẩm!");
    if (!maDanhMuc) return showAlert("modalAlert", "danger", "Vui lòng chọn danh mục!");
    if (!maNCC) return showAlert("modalAlert", "danger", "Vui lòng chọn nhà cung cấp!");
    if (!giaVon || giaVon < 0) return showAlert("modalAlert", "danger", "Giá vốn không hợp lệ!");
    if (!giaBan || giaBan < 0) return showAlert("modalAlert", "danger", "Giá bán không hợp lệ!");
    if (giaBan < giaVon) return showAlert("modalAlert", "warning", "Giá bán đang thấp hơn giá vốn!");

    const btn = document.getElementById("btnLuu");
    btn.disabled = true;
    btn.textContent = "Đang lưu...";

    try {
        const res = await fetch("/api/SanPham", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                maSanPham: 0,
                tenSanPham: ten,
                maVach: maVach,
                maDanhMuc: maDanhMuc,
                maNhaCungCap: maNCC,
                giaVon: giaVon,
                giaBan: giaBan,
                donViTinh: donViTinh || "Cái",
                trangthai: trangthai
            })
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || `Lỗi ${res.status}`);
        }

        modalThem.hide();
        showAlert("spAlert", "success", `✅ Thêm sản phẩm "${ten}" thành công!`);
        loadSanPham(); // refresh bảng

    } catch (err) {
        showAlert("modalAlert", "danger", "Thêm thất bại: " + err.message);
    } finally {
        btn.disabled = false;
        btn.textContent = "Lưu sản phẩm";
    }
}

// ── HELPERS ──────────────────────────────────────────────────
function showAlert(elId, type, msg) {
    const el = document.getElementById(elId);
    el.className = `alert alert-${type}`;
    el.textContent = msg;
    el.classList.remove("d-none");
    if (elId === "spAlert") setTimeout(() => el.classList.add("d-none"), 4000);
}

function formatVND(n) {
    if (!n && n !== 0) return "—";
    return n.toLocaleString("vi-VN") + "đ";
}

// ── QUẢN LÝ TAB ──────────────────────────────────────────────
function chuyenTab(tab) {
    document.getElementById("panel-sp").classList.toggle("d-none", tab !== "sp");
    document.getElementById("panel-dm").classList.toggle("d-none", tab !== "dm");
    document.getElementById("tab-sp").classList.toggle("active", tab === "sp");
    document.getElementById("tab-dm").classList.toggle("active", tab === "dm");

    // Ẩn/hiện nút Lưu sản phẩm
    document.getElementById("btnLuu").classList.toggle("d-none", tab !== "sp");

    if (tab === "dm") renderDanhMucTable();
}

function chuyenTabDanhMuc() {
    chuyenTab("dm");
}

// ── DANH MỤC ─────────────────────────────────────────────────
function renderDanhMucTable() {
    const tbody = document.getElementById("dmBody");
    if (!tbody) return;
    const keys = Object.keys(danhMucMap);
    if (keys.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" class="text-center text-muted py-3">Chưa có danh mục</td></tr>`;
        return;
    }
    tbody.innerHTML = keys.map(id => `
        <tr>
            <td class="text-muted small">#${id}</td>
            <td class="fw-semibold">${danhMucMap[id]}</td>
            <td class="text-muted small">${danhMucMota[id] || "—"}</td>
        </tr>`).join("");
}

async function luuDanhMuc() {
    const ten = document.getElementById("f-dm-ten").value.trim();
    const mota = document.getElementById("f-dm-mota").value.trim();

    if (!ten) return showAlert("dmAlert", "danger", "Vui lòng nhập tên danh mục!");

    try {
        const res = await fetch("/api/DanhMuc", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: 0, ten, mota })
        });
        if (!res.ok) throw new Error(`Lỗi ${res.status}`);
        const data = await res.json();

        // Cập nhật map local
        danhMucMap[data.id] = data.ten;
        danhMucMota[data.id] = data.mota;

        // Thêm vào dropdown filter + form SP
        const opt1 = new Option(data.ten, data.id);
        const opt2 = new Option(data.ten, data.id);
        document.getElementById("danhMucFilter").appendChild(opt1);
        document.getElementById("f-danhmuc").appendChild(opt2);
        document.getElementById("statDanhMuc").textContent =
            Object.keys(danhMucMap).length;

        // Reset form
        document.getElementById("f-dm-ten").value = "";
        document.getElementById("f-dm-mota").value = "";

        showAlert("dmAlert", "success", `✅ Thêm danh mục "${ten}" thành công!`);
        renderDanhMucTable();

    } catch (err) {
        showAlert("dmAlert", "danger", "Thêm thất bại: " + err.message);
    }
}