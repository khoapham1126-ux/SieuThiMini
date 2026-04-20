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
            return Ok(await _context.NhanViens.ToListAsync());
        }

        [HttpPost]
        public async Task<IActionResult> Create(NhanVien nhanVien)
        {
            _context.NhanViens.Add(nhanVien);
            await _context.SaveChangesAsync();
            return Ok(nhanVien);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var nv = await _context.NhanViens.FindAsync(id);
            if (nv == null) return NotFound(new { message = "Không tìm thấy nhân viên!" });
            return Ok(nv);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, NhanVien nhanVien)
        {
            if (id != nhanVien.Id) return BadRequest(new { message = "ID không khớp!" });
            _context.Entry(nhanVien).State = EntityState.Modified;
            try { await _context.SaveChangesAsync(); }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.NhanViens.Any(e => e.Id == id)) return NotFound(new { message = "Nhân viên không tồn tại!" });
                throw;
            }
            return Ok(new { message = "Cập nhật thành công!" });
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
                    vaiTro = user.ChucVu
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