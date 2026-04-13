/**
 * tonkho.js — Lấy dữ liệu từ GET /api/TonKho
 * Đặt file này trong: wwwroot/pages/tonkho.js
 */

const API_URL = "/api/TonKho";

let allProducts = [];
let filteredProducts = [];

document.addEventListener("DOMContentLoaded", () => {
    loadInventory();
});

// ── TẢI DỮ LIỆU TỪ API ───────────────────────────────────────
async function loadInventory() {
    try {
        const res = await fetch(API_URL);

        if (!res.ok) throw new Error(`Lỗi API: ${res.status}`);

        const data = await res.json();
        allProducts = data;

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
        const isOut = p.soLuong === 0;
        const isLow = p.soLuong > 0 && p.soLuong < 10;

        // Số lượng dưới 10 → chữ đỏ
        const qtyClass = (isOut || isLow) ? "qty-low" : "";

        const barClass = isOut ? "bar-low" : isLow ? "bar-low" : p.soLuong < 30 ? "bar-mid" : "bar-ok";
        const barWidth = isOut ? 2 : Math.round((p.soLuong / maxQty) * 100);

        // Badge trạng thái
        const badge = isOut
            ? `<span class="badge badge-het-hang">Hết hàng</span>`
            : isLow
                ? `<span class="badge badge-sap-het">Sắp hết</span>`
                : `<span class="badge badge-con-hang">Còn hàng</span>`;

        return `
        <tr>
            <td class="text-muted small">#${p.id}</td>
            <td class="fw-semibold">Sản phẩm #${p.sanPhamId}</td>
            <td class="text-muted small">Lô #${p.loHangId}</td>
            <td class="text-end">—</td>
            <td>
                <div class="qty-bar-wrap">
                    <span class="${qtyClass}">${p.soLuong}</span>
                    <div class="qty-bar">
                        <div class="qty-bar-fill ${barClass}" style="width:${barWidth}%"></div>
                    </div>
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