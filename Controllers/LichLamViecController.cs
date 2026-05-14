using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApplication1.Data;
using WebApplication1.Models;

namespace WebApplication1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LichLamViecController : ControllerBase
    {
        private readonly AppDbContext _context;

        public LichLamViecController(AppDbContext context)
        {
            _context = context;
        }

        // 1. POST: api/LichLamViec (Nhiệm vụ: Xếp lịch làm việc cho nhân viên)
        [HttpPost]
        public async Task<IActionResult> Create(LichLamViec lich)
        {
            if (lich == null) return BadRequest();

            var allowedShifts = new[] { "Sáng", "Chiều", "Tối" };
            if (!allowedShifts.Contains(lich.Ca))
            {
                return BadRequest(new { message = "Ca làm không hợp lệ. Chỉ chấp nhận Sáng, Chiều, Tối." });
            }

            var startOfDay = lich.NgayLam.Date;
            var endOfDay = startOfDay.AddDays(1);
            var duplicatedShift = await _context.LichLamViecs.AnyAsync(l =>
                l.NhanVienId == lich.NhanVienId &&
                l.Ca == lich.Ca &&
                l.NgayLam >= startOfDay &&
                l.NgayLam < endOfDay);

            if (duplicatedShift)
            {
                return BadRequest(new { message = "Nhân viên đã được đăng ký ca này trong ngày đã chọn." });
            }

            _context.LichLamViecs.Add(lich);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Xếp lịch thành công!", data = lich });
        }

        // 2. GET: api/LichLamViec/nhanvien/5 (Nhiệm vụ: Xem lịch làm của 1 nhân viên cụ thể)
        [HttpGet("nhanvien/{nhanvienId}")]
        public async Task<IActionResult> GetByNhanVien(int nhanvienId)
        {
            var lichList = await _context.LichLamViecs
                                         .Where(l => l.NhanVienId == nhanvienId)
                                         .ToListAsync();

            if (lichList == null || !lichList.Any())
            {
                return NotFound(new { message = "Nhân viên này chưa có lịch làm việc!" });
            }

            return Ok(lichList);
        }

        // 3. GET: api/LichLamViec (Xem toàn bộ lịch làm)
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            return Ok(await _context.LichLamViecs.ToListAsync());
        }
    }
}
