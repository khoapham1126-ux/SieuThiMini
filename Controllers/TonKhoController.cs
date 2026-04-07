
using Microsoft.AspNetCore.Mvc;
using WebApplication1.Data;
using WebApplication1.Models;
using Microsoft.EntityFrameworkCore;

namespace WebApplication1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TonKhoController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TonKhoController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/tonkho
        [HttpGet(Name = "GetTonKho")]
        public async Task<IEnumerable<TonKho>> Get()
        {
            return await _context.TonKhos.ToListAsync();
        }

        // POST: api/tonkho
        [HttpPost]
        public async Task<IActionResult> ThemTonKho([FromBody] TonKho tonkho)
        {
            var existing = await _context.TonKhos
                .FirstOrDefaultAsync(t => t.SanPhamId == tonkho.SanPhamId);

            if (existing != null)
            {
                existing.SoLuong += tonkho.SoLuong;
            }
            else
            {
                _context.TonKhos.Add(tonkho);
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật tồn kho thành công" });
        }

        // PUT: api/tonkho/tru
        [HttpPut("tru")]
        public async Task<IActionResult> TruKho([FromBody] TonKho tonkho)
        {
            var existing = await _context.TonKhos
                .FirstOrDefaultAsync(t => t.SanPhamId == tonkho.SanPhamId);

            if (existing == null)
                return NotFound(new { message = "Không tìm thấy sản phẩm trong kho" });

            // Trừ số lượng
            existing.SoLuong -= tonkho.SoLuong;

            // Tự động tạo cảnh báo nếu SoLuong < 10
            if (existing.SoLuong < 10)
            {
                var canhBao = new CanhBao
                {
                    LoaiCanhBao = "SapHetHang",
                    NoiDung = $"Sản phẩm {existing.SanPhamId} sắp hết hàng, còn {existing.SoLuong} sản phẩm",
                    ThoiGian = DateTime.Now,
                    DaXuLy = false,
                    SanPhamId = existing.SanPhamId
                };
                _context.CanhBaos.Add(canhBao);
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Trừ kho thành công", soLuongConLai = existing.SoLuong });
        }
    }
}