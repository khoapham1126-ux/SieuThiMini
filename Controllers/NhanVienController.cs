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
        public async Task<IActionResult> GetAll()
        {
            var data = await _context.NhanViens
                .Select(n => new
                {
                    n.Id,
                    n.HoTen,
                    n.Username,
                    n.VaiTro,
                    n.SoDienThoai
                })
                .ToListAsync();

            return Ok(data);
        }

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

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] NhanVien nhanVien)
        {
            if (nhanVien == null)
                return BadRequest(new { message = "Dữ liệu nhân viên không hợp lệ!" });

            if (string.IsNullOrWhiteSpace(nhanVien.HoTen))
                return BadRequest(new { message = "Họ tên không được để trống!" });

            if (string.IsNullOrWhiteSpace(nhanVien.Username))
                return BadRequest(new { message = "Username không được để trống!" });

            if (string.IsNullOrWhiteSpace(nhanVien.MatKhau))
                return BadRequest(new { message = "Mật khẩu không được để trống!" });

            try
            {
                var trung = await _context.NhanViens
                    .AnyAsync(n => n.Username == nhanVien.Username);

                if (trung)
                    return BadRequest(new { message = "Username đã tồn tại!" });

                _context.NhanViens.Add(nhanVien);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    id = nhanVien.Id,
                    hoTen = nhanVien.HoTen,
                    username = nhanVien.Username,
                    vaiTro = nhanVien.VaiTro
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] NhanVien nhanVien)
        {
            if (nhanVien == null)
                return BadRequest(new { message = "Dữ liệu nhân viên không hợp lệ!" });

            if (id != nhanVien.Id)
                return BadRequest(new { message = "ID không khớp!" });

            var existing = await _context.NhanViens.FindAsync(id);
            if (existing == null)
                return NotFound(new { message = "Không tìm thấy nhân viên!" });

            var trung = await _context.NhanViens
                .AnyAsync(n => n.Username == nhanVien.Username && n.Id != id);

            if (trung)
                return BadRequest(new { message = "Username đã được dùng bởi nhân viên khác!" });

            existing.HoTen = nhanVien.HoTen;
            existing.Username = nhanVien.Username;
            existing.SoDienThoai = nhanVien.SoDienThoai;
            existing.VaiTro = nhanVien.VaiTro;

            if (!string.IsNullOrWhiteSpace(nhanVien.MatKhau))
                existing.MatKhau = nhanVien.MatKhau;

            try
            {
                await _context.SaveChangesAsync();
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var existing = await _context.NhanViens.FindAsync(id);
            if (existing == null)
                return NotFound(new { message = "Không tìm thấy nhân viên!" });

            try
            {
                _context.NhanViens.Remove(existing);
                await _context.SaveChangesAsync();
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        public class LoginRequest
        {
            public string Username { get; set; } = string.Empty;
            public string MatKhau { get; set; } = string.Empty;
        }
    }
}