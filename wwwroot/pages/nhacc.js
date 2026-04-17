document.addEventListener("DOMContentLoaded", async () => {
    await loadProviderList();
    if (typeof renderUserInfo === "function") renderUserInfo();

    document.getElementById("formNCC").addEventListener("submit", async (e) => {
        e.preventDefault();
        await createProvider();
    });
});

async function loadProviderList() {
    const tbody = document.getElementById("listNCC");
    try {
        const res = await fetch("/api/NhaCungCap");
        if (!res.ok) throw new Error("Không tải được danh sách");
        const providers = await res.json();

        if (!providers || providers.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-3">Chưa có nhà cung cấp</td></tr>`;
            return;
        }

        tbody.innerHTML = providers.map(ncc => `
            <tr>
                <td>${ncc.id ?? ncc.Id ?? "—"}</td>
                <td>${ncc.ten ?? ncc.Ten ?? "—"}</td>
                <td>${ncc.soDienThoai ?? ncc.SoDienThoai ?? "—"}</td>
                <td>${ncc.email ?? ncc.Email ?? "—"}</td>
            </tr>
        `).join("");
    } catch (error) {
        console.error("Lỗi load nhà cung cấp:", error);
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger py-3">Lỗi tải dữ liệu</td></tr>`;
    }
}

async function createProvider() {
    const tenNCC = document.getElementById("tenNCC").value.trim();
    const diaChiEl = document.getElementById("diaChi");
    const sdtEl = document.getElementById("soDienThoai");
    const emailEl = document.getElementById("email");

    const body = {
        Ten: tenNCC,
        DiaChi: diaChiEl ? diaChiEl.value.trim() : "",
        SoDienThoai: sdtEl ? sdtEl.value.trim() : "",
        Email: emailEl ? emailEl.value.trim() : ""
    };

    try {
        const res = await fetch("/api/NhaCungCap", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body);
        });

        if (res.ok) {
            document.getElementById("formNCC").reset();
            await loadProviderList();
        } else {
            alert("Thêm nhà cung cấp thất bại!");
        }
    } catch (error) {
        console.error("Lỗi thêm nhà cung cấp:", error);
    }
}
