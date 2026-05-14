let allEmployees = [];
let allSchedule = [];
let caModal = null;
let currentWeekOffset = 0;
let currentViewMode = "schedule";
let historySchedules = [];

const SHIFT_META = {
    "Sáng": { label: "Sáng", cls: "shift-morning", time: "07:00 - 12:00" },
    "Chiều": { label: "Chiều", cls: "shift-afternoon", time: "12:00 - 17:00" },
    "Tối": { label: "Tối", cls: "shift-evening", time: "17:00 - 22:00" }
};

document.addEventListener("DOMContentLoaded", async () => {
    renderUserInfo();
    caModal = new bootstrap.Modal(document.getElementById("caModal"));

    await loadEmployees();
    await loadAllSchedule();
    buildHistoryData();
    renderAll();

    document.getElementById("historySearch").addEventListener("input", renderHistory);
});

async function loadEmployees() {
    try {
        const res = await fetch("/api/NhanVien");
        if (!res.ok) throw new Error("Không tải được danh sách nhân viên");

        allEmployees = await res.json();

        const sel = document.getElementById("modalNhanVien");
        sel.innerHTML = allEmployees.map(e => {
            const id = e.id ?? e.Id ?? "";
            const name = e.hoTen ?? e.HoTen ?? "";
            return `<option value="${id}">${name}</option>`;
        }).join("");

        document.getElementById("statEmployees").textContent = allEmployees.length;
        document.getElementById("attEmployees").textContent = allEmployees.length;
    } catch (err) {
        allEmployees = [];
        document.getElementById("modalNhanVien").innerHTML = `<option value="">-- Không có dữ liệu --</option>`;
        document.getElementById("statEmployees").textContent = "0";
        document.getElementById("attEmployees").textContent = "0";
        showAlert("danger", err.message || "Không tải được danh sách nhân viên");
    }
}

async function loadAllSchedule() {
    try {
        const res = await fetch("/api/LichLamViec");
        if (!res.ok) throw new Error("Không tải được lịch làm việc");

        allSchedule = await res.json();
    } catch {
        allSchedule = [];
    }
}
function buildHistoryData() {
    historySchedules = [...allSchedule].sort((a, b) => {
        const da = new Date(a.ngayLam ?? a.NgayLam);
        const db = new Date(b.ngayLam ?? b.NgayLam);
        return db - da;
    });
}
function getWeekDates(offset = 0) {
    const today = new Date();
    const day = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1) + offset * 7);
    monday.setHours(0, 0, 0, 0);

    const dates = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        d.setHours(0, 0, 0, 0);
        dates.push(d);
    }
    return dates;
}

function fmtDate(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function fmtDisplay(d) {
    const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    return `${days[d.getDay()]}<br>${d.getDate()}/${d.getMonth() + 1}`;
}

function normalizeScheduleDate(value) {
    if (!value) return "";
    const d = new Date(value);
    if (isNaN(d.getTime())) return "";
    return fmtDate(d);
}

function getEmployeeName(emp) {
    return (emp?.hoTen ?? emp?.HoTen ?? "").trim();
}

function getEmployeeId(emp) {
    return emp?.id ?? emp?.Id ?? null;
}

function getScheduleId(item) {
    return item?.id ?? item?.Id ?? null;
}

function getShiftMeta(ca) {
    return SHIFT_META[ca] || { label: ca || "", cls: "shift-morning", time: "" };
}

function switchTab(mode) {
    currentViewMode = mode;

    document.querySelectorAll(".pill-tabs button").forEach(btn => btn.classList.remove("active"));

    document.getElementById("scheduleTab").classList.remove("active");
    document.getElementById("attendanceTab").classList.remove("active");
    document.getElementById("historyTab").classList.remove("active");

    if (mode === "schedule") {
        document.querySelector(".pill-tabs button:nth-child(1)").classList.add("active");
        document.getElementById("scheduleTab").classList.add("active");
    } else if (mode === "attendance") {
        document.querySelector(".pill-tabs button:nth-child(2)").classList.add("active");
        document.getElementById("attendanceTab").classList.add("active");
    } else if (mode === "history") {
        document.querySelector(".pill-tabs button:nth-child(3)").classList.add("active");
        document.getElementById("historyTab").classList.add("active");
        renderHistory();
    }
}

function getWeekSchedules() {
    const dates = getWeekDates(currentWeekOffset);
    const weekSet = new Set(dates.map(fmtDate));
    return allSchedule.filter(s => weekSet.has(normalizeScheduleDate(s.ngayLam ?? s.NgayLam)));
}

function renderAll() {
    renderWeek();
}
function renderWeek() {
    const dates = getWeekDates(currentWeekOffset);
    const weekSchedules = getWeekSchedules();

    const startStr = `${dates[0].getDate()}/${dates[0].getMonth() + 1}`;
    const endStr = `${dates[6].getDate()}/${dates[6].getMonth() + 1}/${dates[6].getFullYear()}`;
    document.getElementById("weekLabel").textContent = `Tuần: ${startStr} — ${endStr}`;
    document.getElementById("attendanceWeekLabel").textContent = `Tuần: ${startStr} — ${endStr}`;

    renderWeekStats(weekSchedules);
    renderAttendanceSummary(weekSchedules);

    const thead = document.getElementById("weekHeader");
    const todayStr = fmtDate(new Date());

    thead.innerHTML = `<tr>
        <th>Nhân viên</th>
        ${dates.map(d => {
        const isToday = fmtDate(d) === todayStr;
        return `<th class="${isToday ? "today-col" : ""}">${fmtDisplay(d)}</th>`;
    }).join("")}
    </tr>`;

    const tbody = document.getElementById("weekBody");

    if (!allEmployees.length) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center schedule-empty">Chưa có nhân viên</td></tr>`;
        return;
    }

    tbody.innerHTML = allEmployees.map(emp => {
        const empId = getEmployeeId(emp);
        const empName = getEmployeeName(emp);
        const empCode = (empName || "NV").split(" ").map(x => x[0]).join("").slice(0, 2).toUpperCase() || "NV";

        const rowCells = dates.map(d => {
            const dateStr = fmtDate(d);
            const isToday = dateStr === todayStr;

            const shifts = weekSchedules.filter(s =>
                Number(s.nhanVienId ?? s.NhanVienId) === Number(empId) &&
                normalizeScheduleDate(s.ngayLam ?? s.NgayLam) === dateStr
            );

            const shiftOrder = ["Sáng", "Chiều", "Tối"];

            const slotHtml = shiftOrder.map(ca => {
                const items = shifts.filter(s => String(s.ca ?? s.Ca) === ca);

                if (items.length > 0) {
                    const badges = items.map(found => {
                        const meta = getShiftMeta(ca);
                        const id = getScheduleId(found);

                        return `
                            <div class="shift-badge ${meta.cls}" title="${meta.label} ${meta.time} — Click để xóa" onclick="deleteCa(${id})">
                                ${meta.label} <small>×</small>
                            </div>
                        `;
                    }).join("");

                    if (items.length >= 2) {
                        return badges;
                    }

                    return badges + `
                        <div class="add-slot" title="Thêm ${ca}" onclick="openAddModalDate(${empId}, '${dateStr}', '${ca}')">
                            + ${ca}
                        </div>
                    `;
                }

                return `
                    <div class="add-slot" title="Thêm ${ca}" onclick="openAddModalDate(${empId}, '${dateStr}', '${ca}')">
                        + ${ca}
                    </div>
                `;
            }).join("");

            return `
                <td class="${isToday ? "today-col" : ""}">
                    <div class="shift-stack">
                        ${slotHtml}
                    </div>
                </td>
            `;
        }).join("");

        return `
            <tr>
                <td class="emp-cell">
                    <div class="emp-line">
                        <div class="emp-avatar">${empCode}</div>
                        <div>
                            <div>${empName}</div>
                            <div class="day-hint">ID: ${empId}</div>
                        </div>
                    </div>
                </td>
                ${rowCells}
            </tr>
        `;
    }).join("");
}

function renderWeekStats(weekSchedules) {
    const counts = { "Sáng": 0, "Chiều": 0, "Tối": 0 };
    weekSchedules.forEach(s => {
        const ca = s.ca ?? s.Ca;
        if (counts[ca] !== undefined) counts[ca]++;
    });

    document.getElementById("statMorning").textContent = counts["Sáng"];
    document.getElementById("statAfternoon").textContent = counts["Chiều"];
    document.getElementById("statEvening").textContent = counts["Tối"];

    document.getElementById("attTotalShifts").textContent = weekSchedules.length;
    document.getElementById("attMorning").textContent = counts["Sáng"];
    document.getElementById("attAfternoon").textContent = counts["Chiều"];
    document.getElementById("attEvening").textContent = counts["Tối"];
}

function renderAttendanceSummary(weekSchedules) {
    document.getElementById("attCountMorning").textContent = weekSchedules.filter(x => (x.ca ?? x.Ca) === "Sáng").length;
    document.getElementById("attCountAfternoon").textContent = weekSchedules.filter(x => (x.ca ?? x.Ca) === "Chiều").length;
    document.getElementById("attCountEvening").textContent = weekSchedules.filter(x => (x.ca ?? x.Ca) === "Tối").length;

    const tbody = document.getElementById("attendanceBody");
    const rows = allEmployees.map(emp => {
        const empId = Number(getEmployeeId(emp));
        const empName = getEmployeeName(emp);

        const empSchedules = weekSchedules.filter(s => Number(s.nhanVienId ?? s.NhanVienId) === empId);
        const morning = empSchedules.filter(s => (s.ca ?? s.Ca) === "Sáng").length;
        const afternoon = empSchedules.filter(s => (s.ca ?? s.Ca) === "Chiều").length;
        const evening = empSchedules.filter(s => (s.ca ?? s.Ca) === "Tối").length;
        const total = empSchedules.length;

        return `
            <tr>
                <td class="fw-semibold">${empName}</td>
                <td class="text-center"><span class="badge bg-warning text-dark">${morning}</span></td>
                <td class="text-center"><span class="badge bg-primary">${afternoon}</span></td>
                <td class="text-center"><span class="badge bg-secondary">${evening}</span></td>
                <td class="text-center fw-bold">${total}</td>
            </tr>
        `;
    }).join("");

    tbody.innerHTML = rows || `<tr><td colspan="5" class="text-center text-muted py-4">Chưa có dữ liệu</td></tr>`;
}

function changeWeek(direction) {
    if (direction === 0) currentWeekOffset = 0;
    else if (direction === 1) currentWeekOffset += 1;
    else if (direction === -1) currentWeekOffset -= 1;
    else currentWeekOffset = 0;

    renderAll();
}

function openAddModal() {
    if (!isManager()) {
        showAlert("warning", "Bạn chỉ có quyền xem lịch làm việc.");
        return;
    }
    document.getElementById("caModalTitle").textContent = "Thêm ca làm";
    document.getElementById("editId").value = "";
    document.getElementById("modalNgay").value = fmtDate(new Date());
    document.getElementById("modalCa").value = "Sáng";

    if (allEmployees.length > 0) {
        document.getElementById("modalNhanVien").value = getEmployeeId(allEmployees[0]);
    }
    hideModalAlert();
    caModal.show();
}

function openAddModalDate(nhanVienId, dateStr, ca = "Sáng") {
    if (!isManager()) {
        showAlert("warning", "Bạn chỉ có quyền xem lịch làm việc.");
        return;
    }
    document.getElementById("caModalTitle").textContent = "Thêm ca làm";
    document.getElementById("editId").value = "";
    document.getElementById("modalNhanVien").value = nhanVienId;
    document.getElementById("modalNgay").value = dateStr;
    document.getElementById("modalCa").value = ca;
    hideModalAlert();
    caModal.show();
}

function isShiftFull(workDate, shift, ignoreId = null) {
    const targetDate = fmtDate(new Date(workDate));

    const count = allSchedule.filter(item => {
        const id = getScheduleId(item);
        if (ignoreId !== null && Number(id) === Number(ignoreId)) return false;

        return normalizeScheduleDate(item.ngayLam ?? item.NgayLam) === targetDate &&
            String(item.ca ?? item.Ca) === String(shift);
    }).length;

    return count >= 2;
}

async function saveCa() {
    
    if (!isManager()) {
        showAlert("warning", "Bạn chỉ có quyền xem lịch làm việc.");
        return;
    }
    const id = document.getElementById("editId").value || null;
    const employeeId = document.getElementById("modalNhanVien").value;
    const workDate = document.getElementById("modalNgay").value;
    const shift = document.getElementById("modalCa").value;

    if (!employeeId) {
        showAlert("warning", "Vui lòng chọn nhân viên.");
        return;
    }

    if (!workDate) {
        showAlert("warning", "Vui lòng chọn ngày làm.");
        return;
    }

    if (isShiftFull(workDate, shift, id)) {
        showModalAlert("danger", "Ca này trong ngày đã đủ 2 người!");
        return;
    }

    const body = {
        NhanVienId: Number(employeeId),
        NgayLam: workDate,
        Ca: shift
    };

    const url = id ? `/api/LichLamViec/${id}` : "/api/LichLamViec";
    const method = id ? "PUT" : "POST";

    try {
        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            showAlert("danger", data.message || "Lưu thất bại!");
            return;
        }

        caModal.hide();
        await loadAllSchedule();
        buildHistoryData();
        renderAll();
        showAlert("success", id ? "Cập nhật ca làm thành công!" : "Thêm ca làm thành công!");
    } catch {
        showAlert("danger", "Lỗi kết nối!");
    }
}

async function deleteCa(id) {
    if (!isManager()) {
        showAlert("warning", "Bạn chỉ có quyền xem lịch làm việc.");
        return;
    }
    if (!confirm("Xóa ca làm này?")) return;

    try {
        const res = await fetch(`/api/LichLamViec/${id}`, { method: "DELETE" });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            showAlert("danger", data.message || "Xóa thất bại!");
            return;
        }

        await loadAllSchedule();
        buildHistoryData();
        renderAll();
        showAlert("success", "Đã xóa ca làm!");
    } catch {
        showAlert("danger", "Lỗi kết nối!");
    }
}

function showAlert(type, msg) {
    const el = document.getElementById("alertBox");
    el.className = `alert alert-${type} mb-3`;
    el.textContent = msg;
    el.classList.remove("d-none");
    setTimeout(() => el.classList.add("d-none"), 4000);
}

function showModalAlert(type, msg) {
    const el = document.getElementById("modalAlertBox");
    if (!el) return;

    el.className = `alert alert-${type} py-2 small mt-3 mb-0`;
    el.textContent = msg;
    el.classList.remove("d-none");
}

function hideModalAlert() {
    const el = document.getElementById("modalAlertBox");
    if (!el) return;
    el.classList.add("d-none");
    el.textContent = "";
}

function renderHistory() {
    const tbody = document.getElementById("historyBody");
    const count = document.getElementById("historyCount");
    const keyword = (document.getElementById("historySearch")?.value || "").trim().toLowerCase();

    const filtered = historySchedules.filter(item => {
        const empId = Number(item.nhanVienId ?? item.NhanVienId);
        const emp = allEmployees.find(e => Number(e.id ?? e.Id) === empId);
        const empName = emp ? (emp.hoTen ?? emp.HoTen ?? "") : `NV #${empId}`;
        return empName.toLowerCase().includes(keyword);
    });

    if (!filtered.length) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">Không có lịch sử phù hợp</td></tr>`;
        count.textContent = "0 bản ghi";
        return;
    }

    count.textContent = `${filtered.length} bản ghi`;

    tbody.innerHTML = filtered.map(item => {
        const empId = Number(item.nhanVienId ?? item.NhanVienId);
        const emp = allEmployees.find(e => Number(e.id ?? e.Id) === empId);
        const empName = emp ? (emp.hoTen ?? emp.HoTen) : `NV #${empId}`;
        const dateStr = new Date(item.ngayLam ?? item.NgayLam).toLocaleDateString("vi-VN");
        const ca = item.ca ?? item.Ca;

        return `
            <tr>
                <td>${dateStr}</td>
                <td class="fw-semibold">${empName}</td>
                <td>
                    <span class="badge ${ca === "Sáng" ? "bg-warning text-dark" :
                ca === "Chiều" ? "bg-primary" : "bg-secondary"
            }">${ca}</span>
                </td>
                <td>
                    <span class="text-muted small">Đã đăng ký</span>
                </td>
            </tr>
        `;
    }).join("");
}