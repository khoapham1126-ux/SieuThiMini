/**
 * tonkho.js — Lấy dữ liệu từ GET /api/TonKho
 * Đặt file này trong: wwwroot/pages/tonkho.js
 */

const API_URL = "/api/TonKho";

let allProducts = [];
let filteredProducts = [];
let productMap = {};
let loHangMap = {};

document.addEventListener("DOMContentLoaded", () => {
    loadInventory();
});

// ── TẢI DỮ LIỆU TỪ API ───────────────────────────────────────
async function loadInventory() {
    try {
        const [invRes, spRes, loRes] = await Promise.all([
            fetch(API_URL),
            fetch("/api/SanPham"),
            fetch("/api/LoHang")
        ]);

        if (!invRes.ok) throw new Error(`Lỗi API tồn kho: ${invRes.status}`);

        const [invData, spData, loData] = await Promise.all([
            invRes.json(),
            spRes.ok ? spRes.json() : [],
            loRes.ok ? loRes.json() : []
        ]);

        allProducts = invData;

        // Map tên sản phẩm theo maSanPham
        productMap = {};
        spData.forEach(sp => {
            productMap[sp.maSanPham] = sp;
        });

        // Map lô hàng theo Id
        loHangMap = {};
        loData.forEach(lo => {
            loHangMap[lo.id] = lo;
        });

        filterInventory();
        renderStats();

    } catch (err) {
        document.getElementById("inventoryAlert").classList.remove("d-none");
        document.getElementById("inventoryAlert").textContent = "Không thể tải dữ liệu: " + err.message;
        document.getElementById("inventoryBody").innerHTML =
            `<tr><td colspan="6" class="text-center py-4 text-danger">Lỗi tải dữ liệu từ server</td></tr>`;
    }
}

// ── FILTER ───────────────────────────────────────────────────
function filterInventory() {
    const search = document.getElementById("searchInput").value.trim().toLowerCase();
    const stock = document.getElementById("stockFilter").value;

    filteredProducts = allProducts.filter(p => {
        const matchSearch = !search
            || String(p.id).includes(search)
            || String(p.sanPhamId).includes(search)
            || String(p.loHangId).includes(search);

        let matchStock = true;
        if (stock === "low") matchStock = p.soLuong > 0 && p.soLuong < 10;
        if (stock === "ok") matchStock = p.soLuong >= 10;
        if (stock === "out") matchStock = p.soLuong === 0;

        return matchSearch && matchStock;
    });

    renderTable();
    document.getElementById("filterInfo").textContent =
        `Hiển thị ${filteredProducts.length} / ${allProducts.length} bản ghi`;
}

function resetFilter() {
    document.getElementById("searchInput").value = "";
    document.getElementById("stockFilter").value = "";
    filterInventory();
}

// ── RENDER BẢNG ──────────────────────────────────────────────
function renderTable() {
    const tbody = document.getElementById("inventoryBody");
    const maxQty = Math.max(...allProducts.map(p => p.soLuong), 1);

    if (filteredProducts.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">Không có dữ liệu</td></tr>`;
        return;
    }

    tbody.innerHTML = filteredProducts.map(p => {
        const sp = productMap[p.sanPhamId];
        const tenSanPham = sp ? sp.tenSanPham : `Sản phẩm #${p.sanPhamId}`;
        const maVach = sp ? sp.maVach : `Mã #${p.sanPhamId}`;

        const isOut = p.soLuong === 0;
        const isLow = p.soLuong > 0 && p.soLuong < 10;

        const qtyClass = (isOut || isLow) ? "qty-low" : "";
        const barClass = isOut ? "bar-low" : isLow ? "bar-low" : p.soLuong < 30 ? "bar-mid" : "bar-ok";
        const barWidth = isOut ? 2 : Math.round((p.soLuong / maxQty) * 100);

        const badge = isOut
            ? `<span class="badge badge-het-hang">Hết hàng</span>`
            : isLow
                ? `<span class="badge badge-sap-het">Sắp hết</span>`
                : `<span class="badge badge-con-hang">Còn hàng</span>`;

        return `
        <tr>
            <td class="text-muted small">#${p.id}</td>
            <td>
                <div class="fw-semibold">${tenSanPham}</div>
                <div class="text-muted small">${maVach}</div>
            </td>
            <td class="text-muted small">Lô #${p.loHangId}</td>
            <td class="text-end">
                <span class="${qtyClass}">${p.soLuong}</span>
                <div class="qty-bar">
                    <div class="qty-bar-fill ${barClass}" style="width:${barWidth}%"></div>
                </div>
            </td>
            <td class="text-center">${badge}</td>
        </tr>`;
    }).join("");
}

// ── RENDER STATS ─────────────────────────────────────────────
function renderStats() {
    document.getElementById("statTotal").textContent = allProducts.length;
    document.getElementById("statOk").textContent = allProducts.filter(p => p.soLuong >= 10).length;
    document.getElementById("statLow").textContent = allProducts.filter(p => p.soLuong > 0 && p.soLuong < 10).length;
    document.getElementById("statOut").textContent = allProducts.filter(p => p.soLuong === 0).length;
}