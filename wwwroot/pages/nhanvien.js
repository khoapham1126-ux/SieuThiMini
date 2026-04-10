let employeeModal;

document.addEventListener("DOMContentLoaded", () => {
    employeeModal = new bootstrap.Modal(document.getElementById("employeeModal"));
    loadEmployees();

    document.getElementById("employeeForm").addEventListener("submit", saveEmployee);
});

async function loadEmployees() {
    const tbody = document.getElementById("employeeTableBody");
    const alertBox = document.getElementById("employeeAlert");

    try {
        const response = await fetch("/api/NhanVien");
        if (!response.ok) throw new Error("Không tải được danh sách nhân viên");

        const data = await response.json();

        if (!data || data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">Chưa có dữ liệu</td></tr>`;
            return;
        }

        tbody.innerHTML = data.map(item => `
            <tr>
                <td>${item.id ?? ""}</td>
                <td>${item.hoTen ?? ""}</td>
                <td>${item.username ?? ""}</td>
                <td>${item.soDienThoai ?? ""}</td>
                <td>
                    ${item.vaiTro === "Admin"
                ? `<span class="badge badge-role-admin">Quản lý</span>`
                : `<span class="badge badge-role-staff">Nhân viên</span>`}
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick='openEditEmployee(${JSON.stringify(item)})'>Sửa</button>
                </td>
            </tr>
        `).join("");
    } catch (error) {
        alertBox.textContent = error.message;
        alertBox.classList.remove("d-none");
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">Không tải được dữ liệu</td></tr>`;
    }
}

function openAddEmployee() {
    document.getElementById("employeeModalTitle").textContent = "Thêm nhân viên";
    document.getElementById("employeeId").value = "";
    document.getElementById("fullName").value = "";
    document.getElementById("userName").value = "";
    document.getElementById("passWord").value = "";
    document.getElementById("phone").value = "";
    document.getElementById("role").value = "Staff";
    employeeModal.show();
}

function openEditEmployee(employee) {
    document.getElementById("employeeModalTitle").textContent = "Sửa nhân viên";
    document.getElementById("employeeId").value = employee.id ?? "";
    document.getElementById("fullName").value = employee.hoTen ?? "";
    document.getElementById("userName").value = employee.username ?? "";
    document.getElementById("passWord").value = "";
    document.getElementById("phone").value = employee.soDienThoai ?? "";
    document.getElementById("role").value = employee.vaiTro ?? "Staff";
    employeeModal.show();
}

async function saveEmployee(e) {
    e.preventDefault();

    const id = document.getElementById("employeeId").value;

    const body = {
        HoTen: document.getElementById("fullName").value.trim(),
        Username: document.getElementById("userName").value.trim(),
        VaiTro: document.getElementById("role").value,
        SoDienThoai: document.getElementById("phone").value.trim()
    };

    const password = document.getElementById("passWord").value.trim();

    if (!id && !password) {
        alert("Vui lòng nhập mật khẩu cho nhân viên mới");
        return;
    }

    if (password) {
        body.MatKhau = password;
    }

    const url = id ? `/api/NhanVien/${id}` : "/api/NhanVien";
    const method = id ? "PUT" : "POST";

    if (id) {
        body.Id = Number(id);
    }

    try {
        const response = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) throw new Error("Lưu nhân viên thất bại");

        employeeModal.hide();
        loadEmployees();
    } catch (error) {
        alert(error.message);
    }
}