using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApplication1.Data;
using WebApplication1.Models;

namespace WebApplication1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PhieuNhapController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PhieuNhapController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/phieunhap
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            return Ok(await _context.PhieuNhaps
                .OrderByDescending(p => p.Id)
                .ToListAsync());
        }

        // POST: api/phieunhap
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] PhieuNhap phieuNhap, [FromQuery] int sanPhamId, [FromQuery] int soLuong)
        {
            if (sanPhamId <= 0)
                return BadRequest(new { message = "SanPhamId không hợp lệ" });

            if (soLuong <= 0)
                return BadRequest(new { message = "Số lượng nhập phải lớn hơn 0" });

            // 1. Lưu phiếu nhập
            _context.PhieuNhaps.Add(phieuNhap);

            // 2. Cập nhật tồn kho trực tiếp
            var tonKho = await _context.TonKhos
                .FirstOrDefaultAsync(t => t.SanPhamId == sanPhamId);

            if (tonKho != null)
            {
                tonKho.SoLuong += soLuong;
            }
            else
            {
                _context.TonKhos.Add(new TonKho
                {
                    SanPhamId = sanPhamId,
                    SoLuong = soLuong,
                    LoHangId = 0
                });
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Tạo phiếu nhập và cập nhật tồn kho thành công",
                phieuNhap
            });
        }
    }
}