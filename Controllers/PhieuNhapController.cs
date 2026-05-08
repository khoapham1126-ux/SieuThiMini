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

        // GET: api/phieunhap/{id}/chitiet
        [HttpGet("{id}/chitiet")]
        public async Task<IActionResult> GetChiTiet(int id)
        {
            var phieu = await _context.PhieuNhaps.FindAsync(id);
            if (phieu == null)
                return NotFound(new { message = "Không tìm thấy phiếu nhập" });

            var chiTiet = await _context.ChiTietPhieuNhaps
                .Where(c => c.PhieuNhapId == id)
                .Select(c => new
                {
                    c.Id,
                    c.SanPhamId,
                    TenSanPham = _context.SanPhams
                        .Where(s => s.maSanPham == c.SanPhamId)
                        .Select(s => s.tenSanPham)
                        .FirstOrDefault(),
                    c.SoLuong,
                    c.DonGia,
                    ThanhTien = c.SoLuong * c.DonGia,
                    // Lấy lô hàng tương ứng
                    LoHang = _context.LoHangs
                        .Where(l => l.SanPhamId == c.SanPhamId && l.NgayNhap == phieu.NgayNhap)
                        .Select(l => new { l.Id, l.HanSuDung, l.LoaiDonVi })
                        .FirstOrDefault()
                })
                .ToListAsync();

            return Ok(new { phieu, chiTiet });
        }

        // POST: api/phieunhap
        // Body: PhieuNhapRequest (có danh sách sản phẩm nhập)
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] PhieuNhapRequest request)
        {
            // ── Validate ──────────────────────────────────────
            if (request.ChiTiet == null || !request.ChiTiet.Any())
                return BadRequest(new { message = "Phiếu nhập phải có ít nhất 1 sản phẩm" });

            if (request.NhaCungCapId <= 0)
                return BadRequest(new { message = "Vui lòng chọn nhà cung cấp" });

            foreach (var item in request.ChiTiet)
            {
                if (item.SanPhamId <= 0)
                    return BadRequest(new { message = "SanPhamId không hợp lệ" });

                if (item.SoLuong <= 0)
                    return BadRequest(new { message = $"Số lượng sản phẩm #{item.SanPhamId} phải lớn hơn 0" });

                if (item.HanSuDung == default || item.HanSuDung <= DateTime.Now)
                    return BadRequest(new { message = $"Sản phẩm #{item.SanPhamId} thiếu hoặc hạn sử dụng không hợp lệ" });

                if (item.GiaNhap <= 0)
                    return BadRequest(new { message = $"Giá nhập sản phẩm #{item.SanPhamId} phải lớn hơn 0" });
            }

            // ── Tạo phiếu nhập ────────────────────────────────
            var ngayNhap = DateTime.Now;
            decimal tongTien = request.ChiTiet.Sum(c => c.SoLuong * c.GiaNhap);

            var phieuNhap = new PhieuNhap
            {
                NgayNhap = ngayNhap,
                TongTien = tongTien,
                NhaCungCapId = request.NhaCungCapId,
                NhanVienId = request.NhanVienId
            };

            _context.PhieuNhaps.Add(phieuNhap);
            await _context.SaveChangesAsync(); // để có phieuNhap.Id

            // ── Xử lý từng sản phẩm ──────────────────────────
            foreach (var item in request.ChiTiet)
            {
                // 1. Tạo lô hàng mới
                var loHang = new LoHang
                {
                    SanPhamId = item.SanPhamId,
                    NgayNhap = ngayNhap,
                    HanSuDung = item.HanSuDung,
                    GiaNhap = item.GiaNhap,
                    SoLuongNhap = item.SoLuong,
                    LoaiDonVi = item.LoaiDonVi ?? "Cái"
                };
                _context.LoHangs.Add(loHang);
                await _context.SaveChangesAsync(); // để có loHang.Id

                // 2. Tạo chi tiết phiếu nhập
                _context.ChiTietPhieuNhaps.Add(new ChiTietPhieuNhap
                {
                    PhieuNhapId = phieuNhap.Id,
                    SanPhamId = item.SanPhamId,
                    SoLuong = item.SoLuong,
                    DonGia = item.GiaNhap
                });

                // 3. Tạo bản ghi tồn kho mới theo lô
                // Mỗi lô = 1 bản ghi TonKho riêng
                _context.TonKhos.Add(new TonKho
                {
                    SanPhamId = item.SanPhamId,
                    LoHangId = loHang.Id,
                    SoLuong = item.SoLuong
                });
            }

            await _context.SaveChangesAsync();
            foreach (var item in request.ChiTiet)
            {
                var tongTonMoi = await _context.TonKhos
                    .Where(t => t.SanPhamId == item.SanPhamId)
                    .SumAsync(t => t.SoLuong);

                if (tongTonMoi >= 50)
                {
                    var canhBaos = await _context.CanhBaos
                        .Where(c => c.SanPhamId == item.SanPhamId
                                 && c.LoaiCanhBao == "SapHetHang"
                                 && !c.DaXuLy)
                        .ToListAsync();

                    foreach (var cb in canhBaos)
                        cb.DaXuLy = true;
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Tạo phiếu nhập thành công",
                phieuNhapId = phieuNhap.Id,
                tongTien
            });
        }
    }

    // ── Request Models ────────────────────────────────────────
    public class PhieuNhapRequest
    {
        public int NhaCungCapId { get; set; }
        public int NhanVienId { get; set; }
        public List<PhieuNhapChiTietRequest> ChiTiet { get; set; } = new();
    }

    public class PhieuNhapChiTietRequest
    {
        public int SanPhamId { get; set; }
        public int SoLuong { get; set; }
        public decimal GiaNhap { get; set; }
        public DateTime HanSuDung { get; set; }
        public string? LoaiDonVi { get; set; }
    }
}