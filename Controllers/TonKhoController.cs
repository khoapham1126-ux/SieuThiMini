
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

        [HttpGet(Name = "GetTonKho")]
        public async Task<IEnumerable<TonKho>> Get()
        {
            return await _context.TonKhos
                .Include(t => t.SanPham)
                .Include(t => t.LoHang)
                .ToListAsync();
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

        [HttpPut("tru")]
        public async Task<IActionResult> TruKho([FromBody] TonKho tonkho)
        {
            if (tonkho.SoLuong <= 0)
                return BadRequest(new { message = "Số lượng trừ phải lớn hơn 0" });

            var tonKhos = await _context.TonKhos
                .Include(t => t.SanPham)
                .Where(t => t.SanPhamId == tonkho.SanPhamId && t.SoLuong > 0)
                .OrderBy(t => t.LoHangId)
                .ToListAsync();

            if (!tonKhos.Any())
                return NotFound(new { message = "Không tìm thấy sản phẩm trong kho" });

            int soLuongCanTru = tonkho.SoLuong;
            int tongTon = tonKhos.Sum(t => t.SoLuong);

            if (tongTon < soLuongCanTru)
                return BadRequest(new { message = "Không đủ số lượng trong kho để trừ" });

            foreach (var item in tonKhos)
            {
                if (soLuongCanTru <= 0) break;

                if (item.SoLuong >= soLuongCanTru)
                {
                    item.SoLuong -= soLuongCanTru;
                    soLuongCanTru = 0;
                }
                else
                {
                    soLuongCanTru -= item.SoLuong;
                    item.SoLuong = 0;
                }
            }

            await _context.SaveChangesAsync();

            var tongTonMoi = await _context.TonKhos
                .Where(t => t.SanPhamId == tonkho.SanPhamId)
                .SumAsync(t => t.SoLuong);

            if (tongTonMoi < 10)
            {
                var tenSanPham = tonKhos.First().SanPham?.tenSanPham ?? $"SP #{tonkho.SanPhamId}";

                var canhBao = new CanhBao
                {
                    LoaiCanhBao = "SapHetHang",
                    NoiDung = $"Sản phẩm {tenSanPham} sắp hết hàng, còn {tongTonMoi} sản phẩm",
                    ThoiGian = DateTime.Now,
                    DaXuLy = false,
                    SanPhamId = tonkho.SanPhamId
                };

                _context.CanhBaos.Add(canhBao);
                await _context.SaveChangesAsync();
            }

            return Ok(new { message = "Trừ kho thành công", soLuongConLai = tongTonMoi });
        }
    }
}