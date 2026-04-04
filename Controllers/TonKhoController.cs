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
        [HttpPost]
        public async Task<IActionResult> ThemTonKho([FromBody] TonKho tonkho)
        {
            var existing = await _context.TonKhos
                .FirstOrDefaultAsync(t => t.SanPhamId == tonkho.SanPhamId);

            if (existing != null)
            {
                existing.SoLuong += tonkho.SoLuong;
            }
            else
            {
                _context.TonKhos.Add(tonkho);
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật tồn kho thành công" });
        }
    }
}