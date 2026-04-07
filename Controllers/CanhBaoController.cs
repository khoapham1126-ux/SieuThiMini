using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApplication1.Data;
using WebApplication1.Models;

namespace WebApplication1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CanhBaoController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CanhBaoController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/canhbao
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            return Ok(await _context.CanhBaos
                .OrderByDescending(c => c.ThoiGian)
                .ToListAsync());
        }
    }
}