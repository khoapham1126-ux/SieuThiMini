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

        // --- CÁC HÀM CÓ SẴN CỦA NHÓM ---
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
            if (id != nhanVien.Id)
            {
                return BadRequest(new { message = "ID không khớp!" });
            }

            _context.Entry(nhanVien).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.NhanViens.Any(e => e.Id == id))
                {
                    return NotFound(new { message = "Nhân viên không tồn tại!" });
                }
                throw;
            }

            return Ok(new { message = "Cập nhật thông tin nhân viên thành công!" });
        }
    }
}