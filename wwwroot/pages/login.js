document.getElementById("loginForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const Username = document.getElementById("username").value.trim();
    const MatKhau = document.getElementById("password").value.trim();
    const alertBox = document.getElementById("loginAlert");

    alertBox.classList.add("d-none");
    alertBox.textContent = "";

    try {
        const response = await fetch("/api/NhanVien/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ Username, MatKhau })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Sai username hoặc mật khẩu");
        }

        localStorage.setItem("staffName", data.hoTen || "Nhân viên");
        localStorage.setItem("userRole", data.vaiTro || "");
        localStorage.setItem("staffId", data.id || "");

        window.location.href = "index.html";
    } catch (error) {
        alertBox.textContent = error.message;
        alertBox.classList.remove("d-none");
    }
});