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
    }
}