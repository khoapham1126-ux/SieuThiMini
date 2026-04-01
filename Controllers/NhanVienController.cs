using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApplication1.Models;
using WebApplication1.Data; 

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

		// GET: api/NhanVien
		[HttpGet]
		public async Task<ActionResult<IEnumerable<NhanVien>>> GetNhanViens()
		{
			return await _context.NhanViens.ToListAsync();
		}
	}
}