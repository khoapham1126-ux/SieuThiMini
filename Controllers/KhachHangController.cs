using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApplication1.Data;
using WebApplication1.Models;

namespace WebApplication1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class KhachHangController : ControllerBase
    {
        private readonly AppDbContext _context;

        public KhachHangController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            return Ok(await _context.KhachHangs.ToListAsync());
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var kh = await _context.KhachHangs.FindAsync(id);
            if (kh == null) return NotFound(new { message = "Không tìm thấy khách hàng!" });
            return Ok(kh);
        }

        [HttpPost]
        public async Task<IActionResult> Create(KhachHang khachHang)
        {
            _context.KhachHangs.Add(khachHang);
            await _context.SaveChangesAsync();
            return Ok(khachHang);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, KhachHang khachHang)
        {
            if (id != khachHang.Id) return BadRequest(new { message = "Id không khớp!" });

            var existing = await _context.KhachHangs.FindAsync(id);
            if (existing == null)
                return NotFound(new { message = "Không tìm thấy khách hàng!" });

            existing.HoTen = khachHang.HoTen;
            existing.SoDienThoai = khachHang.SoDienThoai;
            existing.DiemTichLuy = khachHang.DiemTichLuy;
            existing.NgayDangKy = khachHang.NgayDangKy;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật khách hàng thành công!" });
        }

        [HttpPut("{id}/cong-diem")]
        public async Task<IActionResult> CongDiem(int id, [FromBody] CongDiemDto dto)
        {
            if (dto == null || dto.SoDiem <= 0)
                return BadRequest(new { message = "Số điểm không hợp lệ!" });

            var khachHang = await _context.KhachHangs.FindAsync(id);
            if (khachHang == null)
                return NotFound(new { message = "Không tìm thấy khách hàng!" });

            khachHang.DiemTichLuy += dto.SoDiem;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Cộng điểm thành công!",
                khachHang.Id,
                khachHang.HoTen,
                khachHang.SoDienThoai,
                khachHang.DiemTichLuy
            });
        }

        [HttpPut("{id}/tru-diem")]
        public async Task<IActionResult> TruDiem(int id, [FromBody] CongDiemDto dto)
        {
            if (dto == null || dto.SoDiem <= 0)
                return BadRequest(new { message = "Số điểm không hợp lệ!" });

            var khachHang = await _context.KhachHangs.FindAsync(id);
            if (khachHang == null)
                return NotFound(new { message = "Không tìm thấy khách hàng!" });

            if (khachHang.DiemTichLuy < dto.SoDiem)
                return BadRequest(new { message = "Không đủ điểm tích lũy!" });

            khachHang.DiemTichLuy -= dto.SoDiem;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Trừ điểm thành công!",
                khachHang.Id,
                khachHang.HoTen,
                khachHang.SoDienThoai,
                khachHang.DiemTichLuy
            });
        }
    }

    public class CongDiemDto
    {
        public decimal SoDiem { get; set; }
    }
}