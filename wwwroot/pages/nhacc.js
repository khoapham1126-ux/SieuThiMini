document.addEventListener("DOMContentLoaded", async () => {
    await loadProviderList();

    if (typeof renderUserInfo === "function") renderUserInfo();

    const form = document.getElementById("formNCC");
    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            await createProvider();
        });
    }
});
async function loadProviderList() {
    const tbody = document.getElementById("listNCC");
    try {
        const res = await fetch("/api/NhaCungCap");
        console.log("status =", res.status);

        const providers = await res.json();
        console.log("RAW providers =", providers);
        console.log("First item =", providers?.[0]);
        console.log("Keys =", providers?.[0] ? Object.keys(providers[0]) : []);

        tbody.innerHTML = providers.map(ncc => `
            <tr>
                <td>${ncc.id}</td>
                <td>${ncc.ten}</td>
                <td>${ncc.soDienThoai}</td>
                <td>${ncc.email}</td>
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

    if (!tenNCC) {
        showProviderAlert("warning", "Vui lòng nhập tên nhà cung cấp!");
        return;
    }

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
            body: JSON.stringify(body)
        });

        if (res.ok) {
            document.getElementById("formNCC").reset();
            await loadProviderList();
            showProviderAlert("success", "Thêm nhà cung cấp thành công!");
        } else {
            showProviderAlert("danger", "Thêm nhà cung cấp thất bại!");
        }
    } catch (error) {
        console.error("Lỗi thêm nhà cung cấp:", error);
        showProviderAlert("danger", "Lỗi kết nối!");
    }
}

function showProviderAlert(type, msg) {
    const el = document.getElementById("providerAlert");
    if (!el) return;

    el.className = `alert alert-${type} py-2 mb-3`;
    el.textContent = msg;
    el.classList.remove("d-none");

    setTimeout(() => {
        el.classList.add("d-none");
    }, 3000);
}