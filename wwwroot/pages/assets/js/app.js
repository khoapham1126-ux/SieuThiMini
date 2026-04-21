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

document.addEventListener("DOMContentLoaded", () => {
    renderUserInfo();
    if (document.getElementById('listKM')) {
        loadKhuyenMai();
    }
});

async function loadKhuyenMai() {
    try {
        const res = await fetch('/api/KhuyenMai');
        const data = await res.json();
        const tbody = document.getElementById('listKM');
        if (!tbody) return;
        
        tbody.innerHTML = data.map(km => `
            <tr>
                <td><span class="fw-bold">${km.ten}</span></td>
                <td><span class="badge bg-danger">-${km.phanTramGiam}%</span></td>
                <td>${new Date(km.ngayBatDau).toLocaleDateString()} - ${new Date(km.ngayKetThuc).toLocaleDateString()}</td>
                <td><button onclick="deleteKM(${km.id})" class="btn btn-sm btn-outline-danger">Xóa</button></td>
            </tr>
        `).join('');
    } catch (err) {
        console.error(err);
    }
}

document.getElementById('formKhuyenMai')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = {
        ten: document.getElementById('tenKM').value,
        phanTramGiam: parseInt(document.getElementById('phanTram').value),
        ngayBatDau: document.getElementById('ngayBD').value,
        ngayKetThuc: document.getElementById('ngayKT').value,
        dieuKienApDung: ""
    };

    const res = await fetch('/api/KhuyenMai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    if (res.ok) {
        loadKhuyenMai();
        e.target.reset();
    }
});

async function deleteKM(id) {
    if (confirm('Xác nhận xóa?')) {
        const res = await fetch(`/api/KhuyenMai/${id}`, { method: 'DELETE' });
        if (res.ok) loadKhuyenMai();
    }
}