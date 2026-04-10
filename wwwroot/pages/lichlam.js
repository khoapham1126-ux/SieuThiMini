document.addEventListener("DOMContentLoaded", () => {
    loadEmployeesForSelect();
    document.getElementById("scheduleForm").addEventListener("submit", saveSchedule);
});

async function loadEmployeesForSelect() {
    const select = document.getElementById("employeeSelect");

    try {
        const response = await fetch("/api/NhanVien");
        if (!response.ok) throw new Error("Không tải được danh sách nhân viên");

        const employees = await response.json();

        select.innerHTML = `<option value="">-- Chọn nhân viên --</option>` + employees.map(x =>
            `<option value="${x.id}">${x.hoTen ?? ""}</option>`
        ).join("");
    } catch (error) {
        alert(error.message);
    }
}

async function loadSchedule() {
    const employeeId = document.getElementById("employeeSelect").value;
    const tbody = document.getElementById("scheduleTableBody");

    if (!employeeId) {
        tbody.innerHTML = `<tr><td colspan="3" class="text-center py-4 text-muted">Vui lòng chọn nhân viên</td></tr>`;
        return;
    }

    try {
        const response = await fetch(`/api/LichLamViec/nhanvien/${employeeId}`);
        const data = await response.json();

        if (!response.ok) {
            tbody.innerHTML = `<tr><td colspan="3" class="text-center py-4 text-muted">${data.message || "Chưa có lịch làm"}</td></tr>`;
            return;
        }

        if (!data || data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" class="text-center py-4 text-muted">Chưa có lịch làm</td></tr>`;
            return;
        }

        tbody.innerHTML = data.map(item => `
            <tr>
                <td>${item.ngayLam ? new Date(item.ngayLam).toLocaleDateString("vi-VN") : ""}</td>
                <td>${item.ca ?? ""}</td>
                <td><span class="badge bg-success">Đã lên lịch</span></td>
            </tr>
        `).join("");
    } catch (error) {
        alert(error.message);
    }
}

async function saveSchedule(e) {
    e.preventDefault();

    const employeeId = document.getElementById("employeeSelect").value;
    const workDate = document.getElementById("workDate").value;
    const shift = document.getElementById("shift").value;

    if (!employeeId) {
        alert("Vui lòng chọn nhân viên");
        return;
    }

    try {
        const response = await fetch("/api/LichLamViec", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                NhanVienId: Number(employeeId),
                NgayLam: workDate,
                Ca: shift
            })
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.message || "Lưu lịch làm thất bại");

        alert("Đã lưu lịch làm");
        loadSchedule();
    } catch (error) {
        alert(error.message);
    }
}