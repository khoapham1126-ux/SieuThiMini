using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApplication1.Data;

namespace WebApplication1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        public AuthController(AppDbContext context) { _context = context; }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var nhanvien = await _context.NhanViens
                .FirstOrDefaultAsync(n => n.Username == request.Username
                                       && n.MatKhau == request.MatKhau);
            if (nhanvien == null)
                return Unauthorized(new { message = "Sai username hoặc mật khẩu" });

            return Ok(new
            {
                message = "Đăng nhập thành công",
                hoTen = nhanvien.HoTen,
                vaiTro = nhanvien.VaiTro
            });
        }
    }

    public class LoginRequest
    {
        public string Username { get; set; } = string.Empty;
        public string MatKhau { get; set; } = string.Empty;
    }
}