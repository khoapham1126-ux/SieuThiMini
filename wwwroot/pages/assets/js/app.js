function getStaffName() {
    return localStorage.getItem("staffName") || "Nhân viên";
}

function getRole() {
    return localStorage.getItem("userRole") || "";
}

function getInitial(name) {
    if (!name) return "K";
    return name.trim().charAt(0).toUpperCase();
}

function checkPermissions() {
    const role = getRole();
    if (role === "Staff" || role === "Nhân viên") {
        const adminModules = [
            "nav-nhan-vien", 
            "nav-khuyen-mai", 
            "nav-nha-cc", 
            "nav-nhap-hang",
            "nav-baocao",
            "nav-canh-bao"
        ];
        adminModules.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.remove(); 
        });
    }
}

function renderUserInfo() {
    const staffNameEl = document.getElementById("staffName");
    const userAvatarEl = document.getElementById("userAvatar");
    const roleBadgeEl = document.getElementById("roleBadge");

    const name = getStaffName();
    const role = getRole();

    if (staffNameEl) staffNameEl.textContent = name;
    if (userAvatarEl) userAvatarEl.textContent = getInitial(name);
    if (roleBadgeEl) roleBadgeEl.textContent = role || "Nhân viên";
    
    checkPermissions();
}

function logout() {
    localStorage.clear();
    window.location.href = "login.html";
}

function getCurrentRole() {
    return (localStorage.getItem("userRole") || "").toLowerCase();
}

function isManager() {
    const role = getCurrentRole();
    return role === "admin" || role === "quanly" || role === "manager";
}

function isEmployee() {
    const role = getCurrentRole();
    return role === "staff" || role === "nhanvien";
}

function canViewReports() {
    return isManager();
}

function canViewEmployeePage() {
    return isManager();
}

function canEditSchedule() {
    return isManager();
}

document.addEventListener("DOMContentLoaded", () => {
    const role = getCurrentRole();

    document.querySelectorAll(".role-manager-only").forEach(el => {
        if (isManager()) el.classList.remove("d-none");
    });
});