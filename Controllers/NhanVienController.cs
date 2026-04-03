using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApplication1.Data;
using WebApplication1.Models;

namespace WebApplication1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class NhanVienController : ControllerBase
    {
        private readonly AppDbContext _context;

        public NhanVienController(AppDbContext context)
        {
            _context = context;
        }

        // GET:
        [HttpGet]
        public async Task<ActionResult<IEnumerable<NhanVien>>> GetNhanViens()
        {
            return await _context.NhanViens.ToListAsync();
        }

        // POST: 
        [HttpPost]
        public async Task<ActionResult<NhanVien>> CreateNhanVien(NhanVien nhanVien)
        {
            _context.NhanViens.Add(nhanVien);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetNhanViens), new { id = nhanVien.Id }, nhanVien);
        }
    }
}