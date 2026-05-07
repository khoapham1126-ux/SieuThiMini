let allTonKho = [];
let allTongHop = [];
let currentTab = "tonghop";

document.addEventListener("DOMContentLoaded", () => {
    loadTongHop();
    loadTheoLo();
    showTab("tonghop");
});

async function loadTongHop() {
    const tbody = document.getElementById("tongHopBody");
    try {
        const res = await fetch("/api/TonKho/tonghop");
        if (!res.ok) throw new Error("Không tải được dữ liệu tổng hợp tồn kho");

        const data = await res.json();
        allTongHop = data;
        renderTongHop(data);
        updateStats();
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">${err.message}</td></tr>`;
    }
}

async function loadTheoLo() {
    const tbody = document.getElementById("inventoryBody");
    try {
        const res = await fetch("/api/TonKho");
        if (!res.ok) throw new Error("Không tải được dữ liệu tồn kho theo lô");

        const data = await res.json();
        allTonKho = data;
        renderTheoLo(data);
        updateStats();
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center py-4 text-muted">${err.message}</td></tr>`;
    }
}

function getTongTon(item) {
    return Number(item.tongTon ?? item.TongTon ?? item.soLuong ?? item.SoLuong ?? 0);
}

function getTrangThaiTongHop(item) {
    const tongTon = getTongTon(item);
    if (tongTon <= 0) return "het";
    if (tongTon < 50) return "sap";
    return "ok";
}

function updateStats() {
    const lots = allTonKho || [];
    const tongHop = allTongHop || [];

    const totalLots = lots.length;
    const ok = lots.filter(x => getLotStatus(x) === "ok").length;
    const sapHetHan = lots.filter(x => getLotStatus(x) === "sap").length;
    const hetHan = lots.filter(x => getLotStatus(x) === "het").length;

    const sapHetHang = tongHop.filter(x => getTrangThaiTongHop(x) === "sap").length;
    const hetHang = tongHop.filter(x => getTrangThaiTongHop(x) === "het").length;

    document.getElementById("statTotal").textContent = totalLots;
    document.getElementById("statOk").textContent = ok;
    document.getElementById("statSapHetHan").textContent = sapHetHan;
    document.getElementById("statHetHan").textContent = hetHan;
    document.getElementById("statSapHetHang").textContent = sapHetHang;
    document.getElementById("statHetHang").textContent = hetHang;
}

function renderTongHop(data) {
    const tbody = document.getElementById("tongHopBody");

    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">Chưa có dữ liệu tồn kho</td></tr>`;
        return;
    }

    tbody.innerHTML = data.map(item => {
        const warning = getTongHopWarning(item);
        const lo = item.loSapHetHan;

        return `
            <tr>
                <td class="fw-semibold text-danger">#${item.sanPhamId}</td>
                <td>${item.tenSanPham || "—"}</td>
                <td class="text-end fw-semibold">${getTongTon(item)}</td>
                <td class="text-center">${item.soLo || 0}</td>
                <td>
                    ${lo
                ? `#${lo.maLo || lo.id || "—"} - ${formatDate(lo.hanSuDung)}`
                : "—"
            }
                </td>
                <td class="text-center">${warning}</td>
            </tr>
        `;
    }).join("");

    document.getElementById("filterInfo").textContent = `Hiển thị ${data.length} sản phẩm`;
}

function renderTheoLo(data) {
    const tbody = document.getElementById("inventoryBody");

    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center py-4 text-muted">Chưa có dữ liệu tồn kho</td></tr>`;
        return;
    }

    tbody.innerHTML = data.map(item => {
        const status = getLotStatus(item);
        const statusInfo = getLotStatusInfo(status);
        const hanClass = status === "het" ? "han-het" : status === "sap" ? "han-do" : "han-binh-thuong";

        return `
            <tr>
                <td class="fw-semibold">#${item.maLo || item.loHangId || "—"}</td>
                <td class="fw-semibold text-danger">#${item.sanPhamId}</td>
                <td>${item.tenSanPham || "—"}</td>
                <td>${formatDate(item.ngayNhap)}</td>
                <td class="${hanClass}">${formatDate(item.hanSuDung)}</td>
                <td class="text-end">${formatCurrency(item.giaNhap)}</td>
                <td class="text-end fw-semibold ${Number(item.soLuong || 0) <= 5 ? "text-warning" : ""}">
                    ${item.soLuong || 0}
                </td>
                <td>${item.donViTinh || item.loaiDonVi || "—"}</td>
                <td class="text-center"><span class="badge ${statusInfo.cls}">${statusInfo.label}</span></td>
            </tr>
        `;
    }).join("");

    document.getElementById("filterInfo").textContent = `Hiển thị ${data.length} lô hàng`;
}

function showTab(tab) {
    currentTab = tab;

    const tongHopPanel = document.getElementById("tongHopPanel");
    const theoLoPanel = document.getElementById("theoLoPanel");
    const btnTongHop = document.getElementById("btnTabTongHop");
    const btnTheoLo = document.getElementById("btnTabTheoLo");
    const filterTongHop = document.getElementById("filterTongHop");
    const filterTheoLo = document.getElementById("filterTheoLo");

    if (tab === "tonghop") {
        tongHopPanel.classList.remove("d-none");
        theoLoPanel.classList.add("d-none");
        filterTongHop.classList.remove("d-none");
        filterTheoLo.classList.add("d-none");
        btnTongHop.classList.add("active");
        btnTheoLo.classList.remove("active");
        renderTongHop(applyTongHopFilter());
    } else {
        tongHopPanel.classList.add("d-none");
        theoLoPanel.classList.remove("d-none");
        filterTongHop.classList.add("d-none");
        filterTheoLo.classList.remove("d-none");
        btnTongHop.classList.remove("active");
        btnTheoLo.classList.add("active");
        renderTheoLo(applyLoFilter());
    }
}

function filterTongHop() {
    if (currentTab !== "tonghop") return;
    renderTongHop(applyTongHopFilter());
}

function applyTongHopFilter() {
    const keyword = (document.getElementById("searchTongHop").value || "").trim().toLowerCase();
    const warning = document.getElementById("tongHopWarningFilter").value;

    return allTongHop.filter(x => {
        const matchName = !keyword || (x.tenSanPham || "").toLowerCase().includes(keyword);
        const matchWarning = !warning || getTrangThaiTongHop(x) === warning;
        return matchName && matchWarning;
    });
}

function resetTongHopFilter() {
    document.getElementById("searchTongHop").value = "";
    document.getElementById("tongHopWarningFilter").value = "";
    if (currentTab === "tonghop") renderTongHop(allTongHop);
}

function filterLo() {
    if (currentTab !== "theolo") return;
    renderTheoLo(applyLoFilter());
}

function applyLoFilter() {
    const maLo = (document.getElementById("searchMaLo").value || "").trim().toLowerCase();
    const maSP = (document.getElementById("searchMaSP").value || "").trim().toLowerCase();
    const tenSP = (document.getElementById("searchTenSP").value || "").trim().toLowerCase();
    const han = document.getElementById("hanFilter").value;

    return allTonKho.filter(x => {
        const matchMaLo = !maLo || String(x.maLo || x.loHangId || "").toLowerCase().includes(maLo);
        const matchMaSP = !maSP || String(x.sanPhamId || "").toLowerCase().includes(maSP);
        const matchTenSP = !tenSP || (x.tenSanPham || "").toLowerCase().includes(tenSP);
        const matchHan = !han || getLotStatus(x) === han;
        return matchMaLo && matchMaSP && matchTenSP && matchHan;
    });
}

function resetFilter() {
    if (currentTab === "tonghop") {
        resetTongHopFilter();
    } else {
        document.getElementById("searchMaLo").value = "";
        document.getElementById("searchMaSP").value = "";
        document.getElementById("searchTenSP").value = "";
        document.getElementById("hanFilter").value = "";
        renderTheoLo(allTonKho);
    }
}

function getLotStatus(item) {
    const han = item.hanSuDung ? new Date(item.hanSuDung) : null;
    if (!han) return "ok";

    const today = new Date();
    const diffDays = Math.ceil((han - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "het";
    if (diffDays <= 30) return "sap";
    return "ok";
}

function getLotStatusInfo(status) {
    switch (status) {
        case "sap":
            return { label: "Sắp hết hạn", cls: "badge-sap-het-han" };
        case "het":
            return { label: "Đã hết hạn", cls: "badge-het-han" };
        default:
            return { label: "Còn hạn", cls: "badge-binh-thuong" };
    }
}

function getTongHopWarning(item) {
    const tongTon = getTongTon(item);
    if (tongTon <= 0) {
        return `<span class="badge badge-het-hang">Hết hàng</span>`;
    }
    if (tongTon < 50) {
        return `<span class="badge badge-sap-het-hang">Sắp hết</span>`;
    }
    return `<span class="badge badge-binh-thuong">Bình thường</span>`;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount || 0);
}

function formatDate(dateStr) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("vi-VN");
}