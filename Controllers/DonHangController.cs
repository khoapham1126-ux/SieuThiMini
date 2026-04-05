using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApplication1.Data;
using WebApplication1.Models;

namespace WebApplication1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DonHangController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DonHangController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/donhang
        [HttpGet]
        public async Task<ActionResult<IEnumerable<DonHang>>> GetDonHangs()
        {
            return await _context.DonHangs.ToListAsync();
        }
        // POST
        [HttpPost]
        public async Task<ActionResult<DonHang>> CreateDonHang(DonHang donHang)
        {
            _context.DonHangs.Add(donHang);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetDonHangs), new { id = donHang.Id }, donHang);
        }
        // POST: api/donhang/{id}/chitiet
        [HttpPost("{id}/chitiet")]
        public async Task<IActionResult> ThemChiTiet(int id, [FromBody] ChiTietDonHang chiTiet)
        {
            var donHang = await _context.DonHangs.FindAsync(id);
            if (donHang == null)
                return NotFound(new { message = "Không tìm th?y ??n hàng" });

            var sanpham = await _context.SanPhams.FindAsync(chiTiet.SanPhamId);
            if (sanpham == null)
                return NotFound(new { message = "Không tìm th?y s?n ph?m" });

            chiTiet.DonHangId = id;
            chiTiet.DonGia = sanpham.giaBan;
            _context.ChiTietDonHangs.Add(chiTiet);

            // C?p nh?t TongTien
            donHang.TongTien += chiTiet.DonGia * chiTiet.SoLuong;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Thêm chi ti?t ??n hàng thành công", chiTiet });
        }

        // PUT: api/donhang/{id}/thanhtoan
        [HttpPut("{id}/thanhtoan")]
        public async Task<IActionResult> ThanhToan(int id, [FromBody] string phuongThucThanhToan)
        {
            var donHang = await _context.DonHangs.FindAsync(id);
            if (donHang == null)
                return NotFound(new { message = "Không tìm th?y ??n hàng" });

            donHang.TrangThai = "DaThanhToan";

            var hoaDon = new HoaDon
            {
                DonHangId = id,
                NgayXuat = DateTime.Now,
                TongTien = donHang.TongTien,
                PhuongThucThanhToan = phuongThucThanhToan ?? "TienMat"
            };
            _context.HoaDons.Add(hoaDon);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Thanh toán thành công", hoaDon });
        }
    }
}