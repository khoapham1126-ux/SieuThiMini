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

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var data = await _context.LichLamViecs
                .AsNoTracking()
                .OrderBy(x => x.NgayLam)
                .ThenBy(x => x.NhanVienId)
                .ThenBy(x => x.Ca)
                .ToListAsync();

            return Ok(data);
        }

        [HttpGet("nhanvien/{nhanvienId}")]
        public async Task<IActionResult> GetByNhanVien(int nhanvienId)
        {
            var lichList = await _context.LichLamViecs
                .AsNoTracking()
                .Where(l => l.NhanVienId == nhanvienId)
                .OrderBy(l => l.NgayLam)
                .ThenBy(l => l.Ca)
                .ToListAsync();

            if (lichList == null || !lichList.Any())
            {
                return NotFound(new { message = "Nhân viên này chưa có lịch làm việc!" });
            }

            return Ok(lichList);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] LichLamViec lich)
        {
            if (lich == null)
                return BadRequest(new { message = "Dữ liệu không hợp lệ!" });

            if (lich.NhanVienId <= 0)
                return BadRequest(new { message = "Vui lòng chọn nhân viên!" });

            if (string.IsNullOrWhiteSpace(lich.Ca))
                return BadRequest(new { message = "Vui lòng chọn ca làm!" });

            lich.NgayLam = lich.NgayLam.Date;

            var count = await _context.LichLamViecs.CountAsync(l =>
                l.NgayLam.Date == lich.NgayLam.Date &&
                l.Ca == lich.Ca);

            if (count >= 2)
            {
                return BadRequest(new { message = "Ca này trong ngày đã đủ 2 người!" });
            }

            _context.LichLamViecs.Add(lich);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Xếp lịch thành công!", data = lich });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] LichLamViec lich)
        {
            if (lich == null)
                return BadRequest(new { message = "Dữ liệu không hợp lệ!" });

            var existing = await _context.LichLamViecs.FindAsync(id);
            if (existing == null)
            {
                return NotFound(new { message = "Không tìm thấy lịch làm việc!" });
            }

            if (lich.NhanVienId <= 0)
                return BadRequest(new { message = "Vui lòng chọn nhân viên!" });

            if (string.IsNullOrWhiteSpace(lich.Ca))
                return BadRequest(new { message = "Vui lòng chọn ca làm!" });

            lich.NgayLam = lich.NgayLam.Date;

            var count = await _context.LichLamViecs.CountAsync(l =>
                l.NgayLam.Date == lich.NgayLam.Date &&
                l.Ca == lich.Ca &&
                l.Id != id);

            if (count >= 2)
            {
                return BadRequest(new { message = "Ca này trong ngày đã đủ 2 người!" });
            }

            existing.NhanVienId = lich.NhanVienId;
            existing.NgayLam = lich.NgayLam;
            existing.Ca = lich.Ca;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Cập nhật ca làm thành công!", data = existing });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var lich = await _context.LichLamViecs.FindAsync(id);
            if (lich == null)
            {
                return NotFound(new { message = "Không tìm thấy lịch làm việc!" });
            }

            _context.LichLamViecs.Remove(lich);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Xóa ca làm thành công!" });
        }
    }
}