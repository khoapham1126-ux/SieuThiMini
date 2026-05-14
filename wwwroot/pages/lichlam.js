const SHIFT_RULES = {
    "Sáng": "07:00 - 12:00",
    "Chiều": "12:00 - 17:00",
    "Tối": "17:00 - 22:00"
};

let currentSchedules = [];

document.addEventListener("DOMContentLoaded", () => {
    loadEmployeesForSelect();
    document.getElementById("scheduleForm").addEventListener("submit", saveSchedule);
    updateWeeklyStats("", []);
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
    const employeeName = getSelectedEmployeeName();
    const tbody = document.getElementById("scheduleTableBody");

    if (!employeeId) {
        tbody.innerHTML = `<tr><td colspan="3" class="text-center py-4 text-muted">Vui lòng chọn nhân viên</td></tr>`;
        currentSchedules = [];
        updateWeeklyStats("", []);
        return;
    }

    try {
        const response = await fetch(`/api/LichLamViec/nhanvien/${employeeId}`);
        const data = await response.json();

        if (!response.ok) {
            tbody.innerHTML = `<tr><td colspan="3" class="text-center py-4 text-muted">${data.message || "Chưa có lịch làm"}</td></tr>`;
            currentSchedules = [];
            updateWeeklyStats(employeeName, []);
            return;
        }

        if (!data || data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" class="text-center py-4 text-muted">Chưa có lịch làm</td></tr>`;
            currentSchedules = [];
            updateWeeklyStats(employeeName, []);
            return;
        }

        currentSchedules = data;

        tbody.innerHTML = data.map(item => `
            <tr>
                <td>${item.ngayLam ? new Date(item.ngayLam).toLocaleDateString("vi-VN") : ""}</td>
                <td>${formatShift(item.ca)}</td>
                <td><span class="badge bg-success">Đã lên lịch</span></td>
            </tr>
        `).join("");

        updateWeeklyStats(employeeName, data);
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

    if (currentSchedules.some(item => isSameShiftInSameDay(item, workDate, shift))) {
        alert("Nhân viên đã có ca này trong ngày đã chọn. Vui lòng chọn ca khác.");
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
        await loadSchedule();
    } catch (error) {
        alert(error.message);
    }
}

function getSelectedEmployeeName() {
    const select = document.getElementById("employeeSelect");
    const selectedOption = select?.options[select.selectedIndex];
    return selectedOption?.text || "";
}

function formatShift(shiftName) {
    if (!shiftName) return "";
    const timeRange = SHIFT_RULES[shiftName];
    return timeRange ? `${shiftName} (${timeRange})` : shiftName;
}

function toDateKey(dateInput) {
    const date = new Date(dateInput);
    if (Number.isNaN(date.getTime())) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function isSameShiftInSameDay(scheduleItem, workDate, shift) {
    return scheduleItem?.ca === shift && toDateKey(scheduleItem.ngayLam) === toDateKey(workDate);
}

function getCurrentWeekRange() {
    const now = new Date();
    const currentDay = now.getDay();
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;

    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + mondayOffset);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    return { weekStart, weekEnd };
}

function updateWeeklyStats(employeeName, schedules) {
    const { weekStart, weekEnd } = getCurrentWeekRange();
    const weeklyList = (schedules || []).filter(item => {
        const date = new Date(item.ngayLam);
        return !Number.isNaN(date.getTime()) && date >= weekStart && date <= weekEnd;
    });

    const counts = {
        total: weeklyList.length,
        "Sáng": 0,
        "Chiều": 0,
        "Tối": 0
    };

    weeklyList.forEach(item => {
        if (Object.prototype.hasOwnProperty.call(counts, item.ca)) {
            counts[item.ca] += 1;
        }
    });

    document.getElementById("weekRangeLabel").textContent =
        `${weekStart.toLocaleDateString("vi-VN")} - ${weekEnd.toLocaleDateString("vi-VN")}`;
    document.getElementById("statsEmployeeName").textContent = employeeName || "Chưa chọn nhân viên";
    document.getElementById("weeklyTotal").textContent = counts.total;
    document.getElementById("weeklyMorning").textContent = counts["Sáng"];
    document.getElementById("weeklyAfternoon").textContent = counts["Chiều"];
    document.getElementById("weeklyEvening").textContent = counts["Tối"];
}
