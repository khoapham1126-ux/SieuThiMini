using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApplication1.Data;
using WebApplication1.Models;

namespace WebApplication1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class KhachHangController : ControllerBase
    {
        private readonly AppDbContext _context;

        public KhachHangController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            return Ok(await _context.KhachHangs.ToListAsync());
        }

        [HttpPost]
        public async Task<IActionResult> Create(KhachHang khachHang)
        {
            _context.KhachHangs.Add(khachHang);
            await _context.SaveChangesAsync();
            return Ok(khachHang);
        }
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var kh = await _context.KhachHangs.FindAsync(id);
            if (kh == null) return NotFound(new { message = "Không tìm thấy khách hàng!" });
            return Ok(kh);
        }

        
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, KhachHang khachHang)
        {
            if (id != khachHang.Id) return BadRequest();
            _context.Entry(khachHang).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật khách hàng thành công!" });
        }
    }
}