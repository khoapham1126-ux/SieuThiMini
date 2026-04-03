using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApplication1.Data;
using WebApplication1.Models;

namespace WebApplication1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DanhMucController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DanhMucController(AppDbContext context)
        {
            _context = context;
        }

        // GET:
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Danhmuc>>> GetDanhMucs()
        {
            return await _context.DanhMucs.ToListAsync();
        }

        // POST: 
        [HttpPost]
        public async Task<ActionResult<Danhmuc>> CreateDanhMuc(Danhmuc danhmuc)
        {
            _context.DanhMucs.Add(danhmuc);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetDanhMucs), new { id = danhmuc.Id }, danhmuc);
        }
    }
}