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
    }
}