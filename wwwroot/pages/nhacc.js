document.addEventListener("DOMContentLoaded", async () => {
    await loadProviderList();
    if (typeof renderUserInfo === "function") renderUserInfo();
    
    document.getElementById("formNCC").addEventListener("submit", async (e) => {
        e.preventDefault();
        await createProvider();
    });
});

async function loadProviderList() {
    try {
        const res = await fetch("/api/NhaCungCap");
        if (res.ok) {
            const providers = await res.json();
            const tbody = document.getElementById("listNCC");
            tbody.innerHTML = providers.map(ncc => `
                <tr>
                    <td>${ncc.id}</td>
                    <td>${ncc.tenNhaCungCap}</td>
                </tr>
            `).join("");
        }
    } catch (error) {
        console.error("Lỗi load nhà cung cấp:", error);
    }
}

async function createProvider() {
    const tenNCC = document.getElementById("tenNCC").value;

    try {
        const res = await fetch("/api/NhaCungCap", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tenNhaCungCap: tenNCC })
        });

        if (res.ok) {
            document.getElementById("formNCC").reset();
            await loadProviderList();
        }
    } catch (error) {
        console.error("Lỗi thêm nhà cung cấp:", error);
    }
}