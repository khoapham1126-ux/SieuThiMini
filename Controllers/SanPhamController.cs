using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApplication1.Data;
using WebApplication1.Models;

namespace WebApplication1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SanPhamController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SanPhamController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/SanPham
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var danhSach = await _context.SanPhams.ToListAsync();
            return Ok(danhSach);
        }

        // POST: api/SanPham
        [HttpPost]
        public async Task<IActionResult> Create(Sanpham sanpham)
        {
            _context.SanPhams.Add(sanpham);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetAll), new { id = sanpham.maSanPham }, sanpham);
        }
        // GET: api/sanpham/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var sanpham = await _context.SanPhams.FindAsync(id);
            if (sanpham == null)
                return NotFound(new { message = $"Không tìm thấy sản phẩm với ID = {id}" });
            return Ok(sanpham);
        }

        // GET: api/sanpham/mavach/{mavach}
        [HttpGet("mavach/{mavach}")]
        public async Task<IActionResult> GetByMaVach(string mavach)
        {
            var sanpham = await _context.SanPhams
                .FirstOrDefaultAsync(s => s.maVach == mavach);
            if (sanpham == null)
                return NotFound(new { message = $"Không tìm thấy sản phẩm với mã vạch: {mavach}" });
            return Ok(sanpham);
        }
    }
}