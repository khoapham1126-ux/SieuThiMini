using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApplication1.Data;

namespace WebApplication1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LoHangController : ControllerBase
    {
        private readonly AppDbContext _context;
        public LoHangController(AppDbContext context) { _context = context; }

        // GET: api/lohang — Vinh dùng để hiển thị tồn kho theo lô
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var data = await _context.LoHangs
                .Include(l => l.SanPham)
                .OrderBy(l => l.HanSuDung)  // FEFO: sắp xếp hết hạn sớm trước
                .Select(l => new
                {
                    l.Id,
                    l.NgayNhap,
                    l.HanSuDung,
                    l.GiaNhap,
                    l.SoLuongNhap,
                    l.LoaiDonVi,
                    l.SanPhamId,
                    TenSanPham = l.SanPham != null ? l.SanPham.tenSanPham : "",
                    DonViTinh = l.SanPham != null ? l.SanPham.DonViTinh : "",
                    // Số lượng tồn thực tế từ bảng TonKho
                    SoLuongTon = _context.TonKhos
                        .Where(t => t.LoHangId == l.Id)
                        .Sum(t => t.SoLuong),
                    // Cờ cảnh báo hạn dưới 30 ngày
                    CanhBaoHan = l.HanSuDung <= DateTime.Now.AddDays(30)
                })
                .ToListAsync();

            return Ok(data);
        }
    }
}