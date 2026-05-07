using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApplication1.Data;
using WebApplication1.Models;

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

        // GET: api/TonKho
        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var data = await _context.TonKhos
                .Include(t => t.SanPham)
                .Include(t => t.LoHang)
                .Select(t => new
                {
                    maLo = t.LoHang != null ? t.LoHang.Id : 0,
                    sanPhamId = t.SanPhamId,
                    tenSanPham = t.SanPham != null ? t.SanPham.tenSanPham : "",
                    ngayNhap = t.LoHang != null ? t.LoHang.NgayNhap : (DateTime?)null,
                    hanSuDung = t.LoHang != null ? t.LoHang.HanSuDung : (DateTime?)null,
                    giaNhap = t.LoHang != null ? t.LoHang.GiaNhap : 0,
                    soLuong = t.SoLuong,
                    donViTinh = t.LoHang != null ? t.LoHang.LoaiDonVi : "",
                    loaiDonVi = t.LoHang != null ? t.LoHang.LoaiDonVi : "",
                    trangThai = t.LoHang != null
                        ? (t.LoHang.HanSuDung < DateTime.Now.Date
                            ? "het"
                            : (t.LoHang.HanSuDung <= DateTime.Now.Date.AddDays(30) ? "sap" : "ok"))
                        : "ok"
                })
                .ToListAsync();

            return Ok(data);
        }

        // GET: api/TonKho/tonghop
        [HttpGet("tonghop")]
        public async Task<IActionResult> GetTongHop()
        {
            var data = await _context.TonKhos
                .Include(t => t.SanPham)
                .Include(t => t.LoHang)
                .GroupBy(t => new
                {
                    t.SanPhamId,
                    TenSanPham = t.SanPham != null ? t.SanPham.tenSanPham : "",
                    MaNhaCungCap = t.SanPham != null ? t.SanPham.maNhaCungCap : 0
                })
                .Select(g => new
                {
                    sanPhamId = g.Key.SanPhamId,
                    tenSanPham = g.Key.TenSanPham,
                    maNhaCungCap = g.Key.MaNhaCungCap,
                    tongTon = g.Sum(x => x.SoLuong),
                    soLo = g.Count(),
                    loSapHetHan = g.OrderBy(x => x.LoHang!.HanSuDung)
                        .Select(x => new
                        {
                            maLo = x.LoHang != null ? x.LoHang.Id : 0,
                            hanSuDung = x.LoHang != null ? x.LoHang.HanSuDung : (DateTime?)null,
                            soLuong = x.SoLuong,
                            trangThai = x.LoHang != null
                                ? (x.LoHang.HanSuDung < DateTime.Now.Date
                                    ? "het"
                                    : (x.LoHang.HanSuDung <= DateTime.Now.Date.AddDays(30) ? "sap" : "ok"))
                                : "ok"
                        })
                        .FirstOrDefault(),
                    trangThai = g.Sum(x => x.SoLuong) <= 0
                        ? "het"
                        : (g.Sum(x => x.SoLuong) < 50 ? "sap" : "ok")
                })
                .OrderBy(x => x.tenSanPham)
                .ToListAsync();

            return Ok(data);
        }

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
                .Include(t => t.LoHang)
                .Where(t => t.SanPhamId == tonkho.SanPhamId && t.SoLuong > 0)
                .OrderBy(t => t.LoHang!.HanSuDung)
                .ToListAsync();

            if (!tonKhos.Any())
                return NotFound(new { message = "Không tìm thấy sản phẩm trong kho" });

            int soLuongCanTru = tonkho.SoLuong;
            int tongTon = tonKhos.Sum(t => t.SoLuong);

            if (tongTon < soLuongCanTru)
                return BadRequest(new { message = $"Không đủ số lượng trong kho (tồn: {tongTon})" });

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

            if (tongTonMoi < 50)
            {
                var tenSanPham = tonKhos.First().SanPham?.tenSanPham ?? $"SP #{tonkho.SanPhamId}";

                var daCoCanhBao = await _context.CanhBaos.AnyAsync(cb =>
                    cb.SanPhamId == tonkho.SanPhamId &&
                    cb.LoaiCanhBao == "SapHetHang" &&
                    !cb.DaXuLy);

                if (!daCoCanhBao)
                {
                    _context.CanhBaos.Add(new CanhBao
                    {
                        LoaiCanhBao = "SapHetHang",
                        NoiDung = $"Sản phẩm {tenSanPham} sắp hết hàng, còn {tongTonMoi}",
                        ThoiGian = DateTime.Now,
                        DaXuLy = false,
                        SanPhamId = tonkho.SanPhamId
                    });

                    await _context.SaveChangesAsync();
                }
            }

            return Ok(new { message = "Trừ kho thành công (FEFO)", soLuongConLai = tongTonMoi });
        }
    }
}