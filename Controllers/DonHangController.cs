using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApplication1.Data;
using WebApplication1.Models;

namespace WebApplication1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DonHangController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DonHangController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/DonHang
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var data = await _context.DonHangs
                .OrderByDescending(d => d.NgayTao)
                .Select(d => new
                {
                    d.Id,
                    d.NgayTao,
                    d.TongTien,
                    d.TrangThai,
                    d.KhachHangId,
                    d.NhanVienId,
                    NhanVienTen = _context.NhanViens
                        .Where(n => n.Id == d.NhanVienId)
                        .Select(n => n.HoTen)
                        .FirstOrDefault(),
                    KhachHangTen = d.KhachHangId == 0
                        ? null
                        : _context.KhachHangs
                            .Where(k => k.Id == d.KhachHangId)
                            .Select(k => k.HoTen)
                            .FirstOrDefault()
                })
                .ToListAsync();

            return Ok(data);
        }

        // GET: api/DonHang/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var donHang = await _context.DonHangs.FindAsync(id);
            if (donHang == null)
                return NotFound(new { message = "Không tìm thấy đơn hàng!" });
            return Ok(donHang);
        }

        // POST: api/DonHang
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] DonHang donHang)
        {
            donHang.NgayTao = DateTime.Now;
            _context.DonHangs.Add(donHang);
            await _context.SaveChangesAsync();
            return Ok(donHang);
        }

        // POST: api/DonHang/{id}/chitiet
        [HttpPost("{id}/chitiet")]
        public async Task<IActionResult> AddChiTiet(int id, [FromBody] ChiTietDonHang chiTiet)
        {
            var donHang = await _context.DonHangs.FindAsync(id);
            if (donHang == null)
                return NotFound(new { message = "Không tìm thấy đơn hàng!" });

            chiTiet.DonHangId = id;
            _context.ChiTietDonHangs.Add(chiTiet);
            await _context.SaveChangesAsync();
            return Ok(chiTiet);
        }

        // PUT: api/DonHang/{id}/thanhtoan
        [HttpPut("{id}/thanhtoan")]
        public async Task<IActionResult> ThanhToan(int id)
        {
            var donHang = await _context.DonHangs.FindAsync(id);
            if (donHang == null)
                return NotFound(new { message = "Không tìm thấy đơn hàng!" });

            if (donHang.TrangThai == "DaThanhToan")
                return Ok(new { message = "Đơn hàng đã được thanh toán!", donHang });

            donHang.TrangThai = "DaThanhToan";

            // Cộng điểm cho khách hàng nếu có
            if (donHang.KhachHangId != 0)
            {
                var khachHang = await _context.KhachHangs.FindAsync(donHang.KhachHangId);
                if (khachHang != null)
                {
                    int diemCong = (int)(donHang.TongTien / 10000); // 10k = 1 điểm
                    if (diemCong > 0)
                    {
                        khachHang.DiemTichLuy += diemCong;
                    }
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Thanh toán thành công!",
                donHang
            });
        }
    }
}