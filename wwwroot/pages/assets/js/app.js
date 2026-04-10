function getStaffName() {
    return localStorage.getItem("staffName") || "Nhân viên";
}

function getRole() {
    return localStorage.getItem("role") || "";
}

function getInitial(name) {
    if (!name) return "K";
    return name.trim().charAt(0).toUpperCase();
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
}

function logout() {
    localStorage.removeItem("staffName");
    localStorage.removeItem("role");
    window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", renderUserInfo);