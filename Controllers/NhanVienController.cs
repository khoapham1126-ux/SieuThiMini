using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApplication1.Data;
using WebApplication1.Models;

namespace WebApplication1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NhanVienController : ControllerBase
    {
        private readonly AppDbContext _context;

        public NhanVienController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll() => Ok(await _context.NhanViens.ToListAsync());

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var user = await _context.NhanViens
                .FirstOrDefaultAsync(u => u.Username == request.Username && u.MatKhau == request.MatKhau);

            if (user != null)
            {
                return Ok(new
                {
                    id = user.Id,
                    hoTen = user.HoTen,
                    vaiTro = user.VaiTro
                });
            }
            return Unauthorized(new { message = "Sai tài khoản hoặc mật khẩu!" });
        }

        public class LoginRequest
        {
            public string Username { get; set; }
            public string MatKhau { get; set; }
        }
    }
}