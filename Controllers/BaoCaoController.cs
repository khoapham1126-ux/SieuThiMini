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

        // GET: api/BaoCao/overview?from=2024-01-01&to=2024-01-31
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

            // Doanh thu (tiền bán)
            var revenue = await paidOrders.SumAsync(d => (decimal?)d.TongTien) ?? 0;

            // Chi phí nhập hàng trong kỳ
            var chiPhiNhap = await _context.PhieuNhaps
                .Where(p => p.NgayNhap >= start && p.NgayNhap < end)
                .SumAsync(p => (decimal?)p.TongTien) ?? 0;

            // Giá vốn hàng bán (COGS) - tính từ chi tiết đơn hàng đã thanh toán
            var chiTietDaThanhToan = await _context.ChiTietDonHangs
                .Where(ct => _context.DonHangs
                    .Any(d => d.Id == ct.DonHangId
                           && d.TrangThai == "DaThanhToan"
                           && d.NgayTao >= start
                           && d.NgayTao < end))
                .Join(_context.SanPhams,
                    ct => ct.SanPhamId,
                    sp => sp.maSanPham,
                    (ct, sp) => new { ct.SoLuong, sp.giaVon })
                .ToListAsync();

            var giaVonHangBan = chiTietDaThanhToan.Sum(x => (decimal)x.SoLuong * x.giaVon);

            // Lợi nhuận gộp = Doanh thu - Giá vốn hàng bán
            var loiNhuanGop = revenue - giaVonHangBan;

            // Tỷ lệ lợi nhuận gộp
            var tyLeLoiNhuan = revenue > 0 ? Math.Round(loiNhuanGop / revenue * 100, 1) : 0;

            var totalOrders = await orders.CountAsync();
            var totalPaid = await paidOrders.CountAsync();
            var totalPending = await pendingOrders.CountAsync();
            var totalCancelled = await cancelledOrders.CountAsync();

            // Giá trị đơn hàng trung bình
            var avgOrderValue = totalPaid > 0 ? revenue / totalPaid : 0;

            return Ok(new
            {
                start,
                end = end.AddDays(-1),
                revenue,
                chiPhiNhap,
                giaVonHangBan,
                loiNhuanGop,
                tyLeLoiNhuan,
                avgOrderValue,
                totalOrders,
                totalPaid,
                totalPending,
                totalCancelled
            });
        }

        // GET: api/BaoCao/daily?from=&to=
        [HttpGet("daily")]
        public async Task<IActionResult> Daily([FromQuery] DateTime? from, [FromQuery] DateTime? to)
        {
            var start = from?.Date ?? DateTime.Today.AddDays(-6);
            var end = (to?.Date ?? DateTime.Today).AddDays(1);

            // Doanh thu theo ngày
            var doanhThuData = await _context.DonHangs
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

            // Chi phí nhập theo ngày (dòng tiền thực tế xuất ra)
            var chiPhiData = await _context.PhieuNhaps
                .Where(p => p.NgayNhap >= start && p.NgayNhap < end)
                .GroupBy(p => p.NgayNhap.Date)
                .Select(g => new
                {
                    date = g.Key,
                    chiPhiNhap = g.Sum(x => x.TongTien)
                })
                .OrderBy(x => x.date)
                .ToListAsync();

            // COGS theo ngày bán (giá vốn hàng đã bán ra - để tính lợi nhuận gộp)
            var cogsRaw = await _context.ChiTietDonHangs
                .Where(ct => _context.DonHangs
                    .Any(d => d.Id == ct.DonHangId
                           && d.TrangThai == "DaThanhToan"
                           && d.NgayTao >= start
                           && d.NgayTao < end))
                .Join(_context.DonHangs,
                    ct => ct.DonHangId,
                    d => d.Id,
                    (ct, d) => new { ct.SoLuong, ct.SanPhamId, NgayBan = d.NgayTao.Date })
                .Join(_context.SanPhams,
                    x => x.SanPhamId,
                    sp => sp.maSanPham,
                    (x, sp) => new { x.SoLuong, x.NgayBan, sp.giaVon })
                .ToListAsync();

            var cogsData = cogsRaw
                .GroupBy(x => x.NgayBan)
                .Select(g => new
                {
                    date = g.Key,
                    cogs = g.Sum(x => (decimal)x.SoLuong * x.giaVon)
                })
                .ToList();

            // Gộp tất cả các ngày từ 3 nguồn
            var allDates = doanhThuData.Select(x => x.date)
                .Union(chiPhiData.Select(x => x.date))
                .Union(cogsData.Select(x => x.date))
                .OrderBy(d => d)
                .ToList();

            var result = allDates.Select(date => new
            {
                date,
                revenue = doanhThuData.FirstOrDefault(x => x.date == date)?.revenue ?? 0,
                orders = doanhThuData.FirstOrDefault(x => x.date == date)?.orders ?? 0,
                chiPhiNhap = chiPhiData.FirstOrDefault(x => x.date == date)?.chiPhiNhap ?? 0,
                cogs = cogsData.FirstOrDefault(x => x.date == date)?.cogs ?? 0
            }).ToList();

            return Ok(result);
        }

        // GET: api/BaoCao/top-products?take=10
        [HttpGet("top-products")]
        public async Task<IActionResult> TopProducts([FromQuery] DateTime? from, [FromQuery] DateTime? to, [FromQuery] int take = 10)
        {
            var start = from?.Date ?? DateTime.Today.AddDays(-29);
            var end = (to?.Date ?? DateTime.Today).AddDays(1);

            var data = await _context.ChiTietDonHangs
                .Where(ct => _context.DonHangs
                    .Any(d => d.Id == ct.DonHangId
                           && d.TrangThai == "DaThanhToan"
                           && d.NgayTao >= start
                           && d.NgayTao < end))
                .GroupBy(ct => ct.SanPhamId)
                .Select(g => new
                {
                    sanPhamId = g.Key,
                    tenSanPham = _context.SanPhams
                        .Where(s => s.maSanPham == g.Key)
                        .Select(s => s.tenSanPham)
                        .FirstOrDefault(),
                    giaVon = _context.SanPhams
                        .Where(s => s.maSanPham == g.Key)
                        .Select(s => s.giaVon)
                        .FirstOrDefault(),
                    soLuongBan = g.Sum(x => x.SoLuong),
                    doanhThu = g.Sum(x => x.SoLuong * x.DonGia)
                })
                .OrderByDescending(x => x.doanhThu)
                .Take(take)
                .ToListAsync();

            var result = data.Select(x => new
            {
                x.sanPhamId,
                x.tenSanPham,
                x.soLuongBan,
                x.doanhThu,
                giaVonHangBan = (decimal)x.soLuongBan * x.giaVon,
                loiNhuan = x.doanhThu - (decimal)x.soLuongBan * x.giaVon,
                tyLeLoiNhuan = x.doanhThu > 0
                    ? Math.Round((x.doanhThu - (decimal)x.soLuongBan * x.giaVon) / x.doanhThu * 100, 1)
                    : 0
            });

            return Ok(result);
        }

        // GET: api/BaoCao/customer-history/{customerId}
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

        // GET: api/BaoCao/nhap-hang?from=&to=
        [HttpGet("nhap-hang")]
        public async Task<IActionResult> NhapHang([FromQuery] DateTime? from, [FromQuery] DateTime? to)
        {
            var start = from?.Date ?? DateTime.Today.AddDays(-6);
            var end = (to?.Date ?? DateTime.Today).AddDays(1);

            var data = await _context.PhieuNhaps
                .Where(p => p.NgayNhap >= start && p.NgayNhap < end)
                .OrderByDescending(p => p.NgayNhap)
                .Select(p => new
                {
                    p.Id,
                    p.NgayNhap,
                    p.TongTien,
                    p.NhaCungCapId,
                    tenNCC = _context.NhaCungCaps
                        .Where(n => n.Id == p.NhaCungCapId)
                        .Select(n => n.Ten)
                        .FirstOrDefault(),
                    p.NhanVienId
                })
                .ToListAsync();

            return Ok(new
            {
                tongChiPhi = data.Sum(x => x.TongTien),
                soPhieu = data.Count,
                data
            });
        }
    }
}