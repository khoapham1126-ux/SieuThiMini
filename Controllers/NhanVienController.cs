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
        // Thêm vào trong class NhanVienController

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] NhanVien nhanVien)
        {
            if (nhanVien == null) return BadRequest();

            _context.NhanViens.Add(nhanVien);
            await _context.SaveChangesAsync();

            return Ok(nhanVien);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] NhanVien nhanVien)
        {
            if (id != nhanVien.Id) return BadRequest("ID không khớp");

            var existingUser = await _context.NhanViens.FindAsync(id);
            if (existingUser == null) return NotFound();

            // Cập nhật thông tin
            existingUser.HoTen = nhanVien.HoTen;
            existingUser.Username = nhanVien.Username;
            existingUser.SoDienThoai = nhanVien.SoDienThoai;
            existingUser.VaiTro = nhanVien.VaiTro;

            // Chỉ cập nhật mật khẩu nếu người dùng nhập mới
            if (!string.IsNullOrEmpty(nhanVien.MatKhau))
            {
                existingUser.MatKhau = nhanVien.MatKhau;
            }

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.NhanViens.Any(e => e.Id == id)) return NotFound();
                throw;
            }

            return NoContent();
        }
    }
}