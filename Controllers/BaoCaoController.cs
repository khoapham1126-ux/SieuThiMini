using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApplication1.Data;

namespace WebApplication1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BaoCaoController : ControllerBase
    {
        private readonly AppDbContext _context;

        public BaoCaoController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("overview")]
        public async Task<IActionResult> Overview([FromQuery] DateTime? from, [FromQuery] DateTime? to)
        {
            var start = from?.Date ?? DateTime.Today.AddDays(-6);
            var end = (to?.Date ?? DateTime.Today).AddDays(1);

            var orders = _context.DonHangs
                .Where(d => d.NgayTao >= start && d.NgayTao < end);

            var paidOrders = orders.Where(d => d.TrangThai == "DaThanhToan");
            var pendingOrders = orders.Where(d => d.TrangThai == "ChoThanhToan");
            var cancelledOrders = orders.Where(d => d.TrangThai == "DaHuy");

            var revenue = await paidOrders.SumAsync(d => (decimal?)d.TongTien) ?? 0;
            var totalOrders = await orders.CountAsync();
            var totalPaid = await paidOrders.CountAsync();
            var totalPending = await pendingOrders.CountAsync();
            var totalCancelled = await cancelledOrders.CountAsync();

            return Ok(new
            {
                start,
                end = end.AddDays(-1),
                revenue,
                totalOrders,
                totalPaid,
                totalPending,
                totalCancelled
            });
        }

        [HttpGet("daily")]
        public async Task<IActionResult> Daily([FromQuery] DateTime? from, [FromQuery] DateTime? to)
        {
            var start = from?.Date ?? DateTime.Today.AddDays(-6);
            var end = (to?.Date ?? DateTime.Today).AddDays(1);

            var data = await _context.DonHangs
                .Where(d => d.TrangThai == "DaThanhToan"
                         && d.NgayTao >= start
                         && d.NgayTao < end)
                .GroupBy(d => d.NgayTao.Date)
                .Select(g => new
                {
                    date = g.Key,
                    revenue = g.Sum(x => x.TongTien),
                    orders = g.Count()
                })
                .OrderBy(x => x.date)
                .ToListAsync();

            return Ok(data);
        }

        [HttpGet("top-products")]
        public async Task<IActionResult> TopProducts([FromQuery] int take = 10)
        {
            var data = await _context.ChiTietDonHangs
                .GroupBy(ct => ct.SanPhamId)
                .Select(g => new
                {
                    sanPhamId = g.Key,
                    tenSanPham = _context.SanPhams
                        .Where(s => s.maSanPham == g.Key)
                        .Select(s => s.tenSanPham)
                        .FirstOrDefault(),
                    soLuongBan = g.Sum(x => x.SoLuong),
                    doanhThu = g.Sum(x => x.SoLuong * x.DonGia)
                })
                .OrderByDescending(x => x.soLuongBan)
                .Take(take)
                .ToListAsync();

            return Ok(data);
        }

        [HttpGet("customer-history/{customerId}")]
        public async Task<IActionResult> CustomerHistory(int customerId)
        {
            var customer = await _context.KhachHangs.FindAsync(customerId);
            if (customer == null)
                return NotFound(new { message = "Không tìm thấy khách hàng" });

            var orders = await _context.DonHangs
                .Where(d => d.KhachHangId == customerId)
                .OrderByDescending(d => d.NgayTao)
                .Select(d => new
                {
                    d.Id,
                    d.NgayTao,
                    d.TongTien,
                    d.TrangThai,
                    d.NhanVienId
                })
                .ToListAsync();

            var totalSpent = orders
                .Where(o => o.TrangThai == "DaThanhToan")
                .Sum(o => o.TongTien);

            return Ok(new
            {
                customer,
                totalOrders = orders.Count,
                totalSpent,
                orders
            });
        }
    }
}