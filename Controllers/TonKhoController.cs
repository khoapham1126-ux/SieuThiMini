using Microsoft.AspNetCore.Mvc;
using WebApplication1.Data;
using WebApplication1.Models;
using Microsoft.EntityFrameworkCore;

namespace WebApplication1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TonKhoController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TonKhoController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet(Name = "GetTonKho")]
        public async Task<IEnumerable<TonKho>> Get()
        {
            return await _context.TonKhos.ToListAsync();
        }
    }
}