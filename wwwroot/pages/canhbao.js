/**
 * canhbao.js — Trang Cảnh Báo
 * Realtime auto refresh
 */

const API_URL = "/api/CanhBao";

let allData = [];
let filteredData = [];
let refreshTimer = null;

document.addEventListener("DOMContentLoaded", async () => {
    await refreshCanhBao();
    startAutoRefresh();
});

async function quetCanhBao() {
    try {
        await fetch("/api/CanhBao/quet", { method: "POST" });
    } catch {
        // bỏ qua nếu lỗi, vẫn load danh sách bình thường
    }
}

// ── AUTO REFRESH ─────────────────────────────────────────────
async function refreshCanhBao() {
    await quetCanhBao();
    await loadCanhBao();
}

function startAutoRefresh() {
    if (refreshTimer) clearInterval(refreshTimer);

    refreshTimer = setInterval(async () => {
        await refreshCanhBao();
    }, 5000); // 5 giây/lần
}

// ── LOAD DỮ LIỆU ─────────────────────────────────────────────
async function loadCanhBao() {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error(`Lỗi ${res.status}`);
        const data = await res.json();

        allData = data;
        populateLoaiFilter();
        filterCanhBao();
        renderStats();

    } catch (err) {
        showAlert("danger", "Không tải được dữ liệu: " + err.message);
        document.getElementById("canhBaoBody").innerHTML =
            `<tr><td colspan="7" class="text-center py-4 text-danger">Lỗi tải dữ liệu</td></tr>`;
    }
}

// ── FILTER ───────────────────────────────────────────────────
function populateLoaiFilter() {
    const loaiSet = [...new Set(allData.map(c => c.loaiCanhBao).filter(Boolean))].sort();
    const sel = document.getElementById("loaiFilter");
    if (!sel) return;

    const current = sel.value;
    sel.innerHTML = `<option value="">-- Tất cả loại --</option>`;

    loaiSet.forEach(l => {
        const opt = document.createElement("option");
        opt.value = l;
        opt.textContent = l;
        sel.appendChild(opt);
    });

    sel.value = current;
}

function filterCanhBao() {
    const search = document.getElementById("searchInput").value.trim().toLowerCase();
    const status = document.getElementById("statusFilter").value;
    const loai = document.getElementById("loaiFilter").value;

    filteredData = allData.filter(c => {
        const matchSearch = !search ||
            (c.noiDung || "").toLowerCase().includes(search) ||
            (c.loaiCanhBao || "").toLowerCase().includes(search);
        const matchStatus = !status ||
            (status === "chua" && !c.daXuLy) ||
            (status === "da" && c.daXuLy);
        const matchLoai = !loai || c.loaiCanhBao === loai;
        return matchSearch && matchStatus && matchLoai;
    });

    renderTable();
    document.getElementById("filterInfo").textContent =
        `Hiển thị ${filteredData.length} / ${allData.length} cảnh báo`;
}

function resetFilter() {
    document.getElementById("searchInput").value = "";
    document.getElementById("statusFilter").value = "";
    document.getElementById("loaiFilter").value = "";
    filterCanhBao();
}

// ── RENDER BẢNG ──────────────────────────────────────────────
function renderTable() {
    const tbody = document.getElementById("canhBaoBody");
    if (!tbody) return;

    if (filteredData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">Không có cảnh báo nào</td></tr>`;
        return;
    }

    // Sắp xếp: chưa xử lý lên trên
    const sorted = [...filteredData].sort((a, b) => Number(a.daXuLy) - Number(b.daXuLy));

    tbody.innerHTML = sorted.map(c => {
        const badge = c.daXuLy
            ? `<span class="badge badge-da-xu-ly">Đã xử lý</span>`
            : `<span class="badge badge-chua-xu-ly">Chưa xử lý</span>`;

        const btnXuLy = c.daXuLy
            ? `<button class="btn-xu-ly" disabled>✓ Xong</button>`
            : `<button class="btn-xu-ly" onclick="xacNhanXuLy(${c.id}, this)">Đã xử lý</button>`;

        return `
            <tr id="row-${c.id}">
                <td class="text-muted small">#${c.id}</td>
                <td><span class="badge bg-secondary bg-opacity-10 text-secondary">${c.loaiCanhBao || "—"}</span></td>
                <td>${c.noiDung || "—"}</td>
                <td class="text-muted small">SP #${c.sanPhamId}</td>
                <td class="small">${formatDate(c.thoiGian)}</td>
                <td class="text-center">${badge}</td>
                <td class="text-center">${btnXuLy}</td>
            </tr>`;
    }).join("");
}

// ── XỬ LÝ CẢNH BÁO ──────────────────────────────────────────
async function xacNhanXuLy(id, btn) {
    btn.disabled = true;
    btn.textContent = "...";

    const item = allData.find(c => c.id === id);
    if (!item) return;

    try {
        const res = await fetch(`${API_URL}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...item, daXuLy: true })
        });

        if (!res.ok) throw new Error(`Lỗi ${res.status}`);

        // refresh realtime
        await refreshCanhBao();
        showAlert("success", `✅ Cảnh báo #${id} đã được xử lý!`);

    } catch (err) {
        btn.disabled = false;
        btn.textContent = "Đã xử lý";
        showAlert("danger", "Cập nhật thất bại: " + err.message);
    }
}

// ── RENDER STATS ─────────────────────────────────────────────
function renderStats() {
    document.getElementById("statTotal").textContent = allData.length;
    document.getElementById("statChua").textContent = allData.filter(c => !c.daXuLy).length;
    document.getElementById("statDa").textContent = allData.filter(c => c.daXuLy).length;
}

// ── HELPERS ──────────────────────────────────────────────────
function showAlert(type, msg) {
    const el = document.getElementById("canhBaoAlert");
    if (!el) return;

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