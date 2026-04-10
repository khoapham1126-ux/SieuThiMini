document.addEventListener("DOMContentLoaded", async () => {
    await loadDashboardStats();
    renderUserInfo();
});

async function loadDashboardStats() {
    try {
        const [employeesRes, customersRes, productsRes, warningsRes] = await Promise.all([
            fetch("/api/NhanVien"),
            fetch("/api/KhachHang"),
            fetch("/api/SanPham"),
            fetch("/api/CanhBao")
        ]);

        const employees = employeesRes.ok ? await employeesRes.json() : [];
        const customers = customersRes.ok ? await customersRes.json() : [];
        const products = productsRes.ok ? await productsRes.json() : [];
        const warnings = warningsRes.ok ? await warningsRes.json() : [];

        document.getElementById("totalEmployees").textContent = employees.length;
        document.getElementById("totalCustomers").textContent = customers.length;
        document.getElementById("totalProducts").textContent = products.length;
        document.getElementById("totalWarnings").textContent = warnings.length;
    } catch (error) {
        console.error("Lỗi load dashboard:", error);
        document.getElementById("totalEmployees").textContent = "N/A";
        document.getElementById("totalCustomers").textContent = "N/A";
        document.getElementById("totalProducts").textContent = "N/A";
        document.getElementById("totalWarnings").textContent = "N/A";
    }
}