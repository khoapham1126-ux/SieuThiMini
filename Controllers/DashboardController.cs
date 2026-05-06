using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApplication1.Data;

namespace WebApplication1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DashboardController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary()
        {
            var today = DateTime.Today;
            var tomorrow = today.AddDays(1);
            var firstDayOfMonth = new DateTime(today.Year, today.Month, 1);
            var firstDayNextMonth = firstDayOfMonth.AddMonths(1);

            var totalEmployees = await _context.NhanViens.CountAsync();
            var totalCustomers = await _context.KhachHangs.CountAsync();
            var totalProducts = await _context.SanPhams.CountAsync();
            var totalWarnings = await _context.CanhBaos.CountAsync();

            var todayRevenue = await _context.DonHangs
                .Where(d => d.TrangThai == "DaThanhToan"
                         && d.NgayTao >= today
                         && d.NgayTao < tomorrow)
                .SumAsync(d => (decimal?)d.TongTien) ?? 0;

            var monthRevenue = await _context.DonHangs
                .Where(d => d.TrangThai == "DaThanhToan"
                         && d.NgayTao >= firstDayOfMonth
                         && d.NgayTao < firstDayNextMonth)
                .SumAsync(d => (decimal?)d.TongTien) ?? 0;

            var todayOrders = await _context.DonHangs
                .CountAsync(d => d.NgayTao >= today && d.NgayTao < tomorrow);

            var pendingOrders = await _context.DonHangs
                .CountAsync(d => d.TrangThai == "ChoThanhToan");

            return Ok(new
            {
                totalEmployees,
                totalCustomers,
                totalProducts,
                totalWarnings,
                todayRevenue,
                monthRevenue,
                todayOrders,
                pendingOrders
            });
        }

        [HttpGet("revenue-7days")]
        public async Task<IActionResult> Revenue7Days()
        {
            var fromDate = DateTime.Today.AddDays(-6);
            var toDate = DateTime.Today.AddDays(1);

            var data = await _context.DonHangs
                .Where(d => d.TrangThai == "DaThanhToan"
                         && d.NgayTao >= fromDate
                         && d.NgayTao < toDate)
                .GroupBy(d => d.NgayTao.Date)
                .Select(g => new
                {
                    date = g.Key,
                    revenue = g.Sum(x => x.TongTien)
                })
                .OrderBy(x => x.date)
                .ToListAsync();

            return Ok(data);
        }

        [HttpGet("top-products")]
        public async Task<IActionResult> TopProducts()
        {
            var data = await _context.ChiTietDonHangs
                .GroupBy(ct => ct.SanPhamId)
                .Select(g => new
                {
                    sanPhamId = g.Key,
                    soLuongBan = g.Sum(x => x.SoLuong),
                    doanhThu = g.Sum(x => x.SoLuong * x.DonGia),
                    tenSanPham = _context.SanPhams
                        .Where(s => s.maSanPham == g.Key)
                        .Select(s => s.tenSanPham)
                        .FirstOrDefault()
                })
                .OrderByDescending(x => x.soLuongBan)
                .Take(10)
                .ToListAsync();

            return Ok(data);
        }

        [HttpGet("orders-by-status")]
        public async Task<IActionResult> OrdersByStatus()
        {
            var data = await _context.DonHangs
                .GroupBy(d => d.TrangThai)
                .Select(g => new
                {
                    trangThai = g.Key,
                    soLuong = g.Count()
                })
                .ToListAsync();

            return Ok(data);
        }
    }
}