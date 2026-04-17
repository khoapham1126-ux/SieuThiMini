document.addEventListener("DOMContentLoaded", async () => {
    await loadCustomerList();
    if (typeof renderUserInfo === "function") renderUserInfo();

    document.getElementById("formKhachHang").addEventListener("submit", async (e) => {
        e.preventDefault();
        await createCustomer();
    });
});

async function loadCustomerList() {
    const tbody = document.getElementById("listKhachHang");
    try {
        const res = await fetch("/api/KhachHang");
        if (!res.ok) throw new Error("Không tải được danh sách");
        const customers = await res.json();

        if (!customers || customers.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-3">Chưa có khách hàng</td></tr>`;
            return;
        }

        tbody.innerHTML = customers.map(kh => `
            <tr>
                <td>${kh.id}</td>
                <td class="fw-semibold">${kh.hoTen ?? "—"}</td>
                <td>${kh.soDienThoai ?? "—"}</td>
                <td><span class="badge bg-info text-dark">${kh.diemTichLuy ?? 0} điểm</span></td>
                <td class="text-muted small">${kh.ngayDangKy ? new Date(kh.ngayDangKy).toLocaleDateString("vi-VN") : "—"}</td>
            </tr>
        `).join("");
    } catch (error) {
        console.error("Lỗi load khách hàng:", error);
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger py-3">Lỗi tải dữ liệu</td></tr>`;
    }
}

async function createCustomer() {
    const tenKH = document.getElementById("tenKH").value.trim();
    const sdtKH = document.getElementById("sdtKH").value.trim();

    if (!tenKH || !sdtKH) {
        alert("Vui lòng nhập đầy đủ tên và số điện thoại!");
        return;
    }

    try {
        const res = await fetch("/api/KhachHang", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                HoTen: tenKH,
                SoDienThoai: sdtKH,
                DiemTichLuy: 0,
                NgayDangKy: new Date().toISOString()
            })
        });

        if (res.ok) {
            document.getElementById("formKhachHang").reset();
            await loadCustomerList();
        } else {
            alert("Thêm khách hàng thất bại!");
        }
    } catch (error) {
        console.error("Lỗi thêm khách hàng:", error);
    }
}