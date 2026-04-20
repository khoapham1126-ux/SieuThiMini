using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApplication1.Data;
using WebApplication1.Models;

namespace WebApplication1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class KhuyenMaiController : ControllerBase
    {
        private readonly AppDbContext _context;

        public KhuyenMaiController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            return Ok(await _context.KhuyenMais.ToListAsync());
        }

        [HttpPost]
        public async Task<IActionResult> Create(KhuyenMai km)
        {
            _context.KhuyenMais.Add(km);
            await _context.SaveChangesAsync();
            return Ok(km);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var km = await _context.KhuyenMais.FindAsync(id);
            if (km == null) return NotFound();
            return Ok(km);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, KhuyenMai km)
        {
            if (id != km.Id) return BadRequest();
            _context.Entry(km).State = EntityState.Modified;
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.KhuyenMais.Any(e => e.Id == id)) return NotFound();
                throw;
            }
            return Ok(km);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var km = await _context.KhuyenMais.FindAsync(id);
            if (km == null) return NotFound();
            _context.KhuyenMais.Remove(km);
            await _context.SaveChangesAsync();
            return Ok();
        }
    }
}