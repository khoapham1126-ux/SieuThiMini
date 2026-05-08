using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApplication1.Data;
using WebApplication1.Models;

namespace WebApplication1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CanhBaoController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CanhBaoController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/canhbao
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            return Ok(await _context.CanhBaos
                .Include(c => c.SanPham)
                .OrderByDescending(c => c.ThoiGian)
                .ToListAsync());
        }
        // PUT: api/CanhBao/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> CapNhatXuLy(int id, [FromBody] CanhBao updated)
        {
            var item = await _context.CanhBaos.FindAsync(id);
            if (item == null) return NotFound();

            item.DaXuLy = updated.DaXuLy;

            await _context.SaveChangesAsync();
            return Ok(item);
        }
        // POST: api/CanhBao/quet
        [HttpPost("quet")]
        public async Task<IActionResult> QuetCanhBao()
        {
            int soLuongTao = 0;
            int soLuongDong = 0;

            // ── 0. TỰ ĐỘNG ĐÓNG cảnh báo không còn hiệu lực ─────

            // Đóng SapHetHang nếu tồn kho đã đủ (>= 50)
            var canhBaoSapHetHang = await _context.CanhBaos
                .Where(c => c.LoaiCanhBao == "SapHetHang" && !c.DaXuLy)
                .ToListAsync();

            foreach (var cb in canhBaoSapHetHang)
            {
                var tongTon = await _context.TonKhos
                    .Where(t => t.SanPhamId == cb.SanPhamId)
                    .SumAsync(t => t.SoLuong);

                if (tongTon >= 50)
                {
                    cb.DaXuLy = true;
                    soLuongDong++;
                }
            }

            // Đóng SapHetHan nếu lô đó đã hết hàng (không cần báo nữa)
            var canhBaoSapHetHan = await _context.CanhBaos
                .Where(c => c.LoaiCanhBao == "SapHetHan" && !c.DaXuLy)
                .ToListAsync();

            foreach (var cb in canhBaoSapHetHan)
            {
                // Lấy lô từ nội dung cảnh báo không chắc, 
                // nên kiểm tra tổng tồn của sản phẩm đó
                var tongTon = await _context.TonKhos
                    .Where(t => t.SanPhamId == cb.SanPhamId)
                    .SumAsync(t => t.SoLuong);

                if (tongTon <= 0)
                {
                    // Hết hàng rồi thì SapHetHan không còn nghĩa, đóng lại
                    cb.DaXuLy = true;
                    soLuongDong++;
                }
            }

            await _context.SaveChangesAsync();

            // ── 1. Quét lô sắp hết hạn (≤ 30 ngày) ──────────────
            var loSapHetHan = await _context.LoHangs
                .Include(l => l.SanPham)
                .Where(l => l.HanSuDung > DateTime.Now &&
                            l.HanSuDung <= DateTime.Now.AddDays(30))
                .ToListAsync();

            foreach (var lo in loSapHetHan)
            {
                // Kiểm tra tồn kho của lô này còn hàng không
                var soLuongTon = await _context.TonKhos
                    .Where(t => t.LoHangId == lo.Id)
                    .SumAsync(t => t.SoLuong);

                if (soLuongTon <= 0) continue; // lô đã hết hàng thì bỏ qua

                // Kiểm tra đã có cảnh báo chưa xử lý chưa
                var daCo = await _context.CanhBaos.AnyAsync(c =>
                    c.SanPhamId == lo.SanPhamId &&
                    c.LoaiCanhBao == "SapHetHan" &&
                    c.NoiDung.Contains($"Lô #{lo.Id}") &&
                    !c.DaXuLy);

                if (daCo) continue;

                var tenSP = lo.SanPham?.tenSanPham ?? $"SP #{lo.SanPhamId}";
                var soNgay = (lo.HanSuDung.Date - DateTime.Now.Date).Days;

                _context.CanhBaos.Add(new CanhBao
                {
                    LoaiCanhBao = "SapHetHan",
                    NoiDung = $"Lô #{lo.Id} - {tenSP} sắp hết hạn sau {soNgay} ngày ({lo.HanSuDung:dd/MM/yyyy})",
                    ThoiGian = DateTime.Now,
                    DaXuLy = false,
                    SanPhamId = lo.SanPhamId
                });
                soLuongTao++;
            }

            // ── 2. Quét lô đã hết hạn ────────────────────────────
            var loHetHan = await _context.LoHangs
                .Include(l => l.SanPham)
                .Where(l => l.HanSuDung < DateTime.Now)
                .ToListAsync();

            foreach (var lo in loHetHan)
            {
                var soLuongTon = await _context.TonKhos
                    .Where(t => t.LoHangId == lo.Id)
                    .SumAsync(t => t.SoLuong);

                if (soLuongTon <= 0) continue;

                var daCo = await _context.CanhBaos.AnyAsync(c =>
                    c.SanPhamId == lo.SanPhamId &&
                    c.LoaiCanhBao == "HetHan" &&
                    c.NoiDung.Contains($"Lô #{lo.Id}") &&
                    !c.DaXuLy);

                if (daCo) continue;

                var tenSP = lo.SanPham?.tenSanPham ?? $"SP #{lo.SanPhamId}";

                _context.CanhBaos.Add(new CanhBao
                {
                    LoaiCanhBao = "HetHan",
                    NoiDung = $"Lô #{lo.Id} - {tenSP} đã hết hạn ngày {lo.HanSuDung:dd/MM/yyyy}, còn {soLuongTon} sản phẩm trong kho!",
                    ThoiGian = DateTime.Now,
                    DaXuLy = false,
                    SanPhamId = lo.SanPhamId
                });
                soLuongTao++;
            }

            // ── 3. Quét sản phẩm sắp hết hàng (tổng tồn < 50) ───
            var dsSanPham = await _context.TonKhos
                .GroupBy(t => t.SanPhamId)
                .Select(g => new { SanPhamId = g.Key, TongTon = g.Sum(x => x.SoLuong) })
                .Where(x => x.TongTon > 0 && x.TongTon < 50)
                .ToListAsync();

            foreach (var sp in dsSanPham)
            {
                var daCo = await _context.CanhBaos.AnyAsync(c =>
                    c.SanPhamId == sp.SanPhamId &&
                    c.LoaiCanhBao == "SapHetHang" &&
                    !c.DaXuLy);

                if (daCo) continue;

                var tenSP = await _context.SanPhams
                    .Where(s => s.maSanPham == sp.SanPhamId)
                    .Select(s => s.tenSanPham)
                    .FirstOrDefaultAsync() ?? $"SP #{sp.SanPhamId}";

                _context.CanhBaos.Add(new CanhBao
                {
                    LoaiCanhBao = "SapHetHang",
                    NoiDung = $"Sản phẩm {tenSP} sắp hết hàng, còn {sp.TongTon}",
                    ThoiGian = DateTime.Now,
                    DaXuLy = false,
                    SanPhamId = sp.SanPhamId
                });
                soLuongTao++;
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = $"Quét xong, tạo {soLuongTao} cảnh báo mới" });
        }
    }
   
}