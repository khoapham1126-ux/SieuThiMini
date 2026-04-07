using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text;
using System.Text.Json;
using WebApplication1.Data;
using WebApplication1.Models;

namespace WebApplication1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PhieuNhapController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly HttpClient _httpClient;

        public PhieuNhapController(AppDbContext context, IHttpClientFactory httpClientFactory)
        {
            _context = context;
            _httpClient = httpClientFactory.CreateClient();
        }

        // GET: api/phieunhap
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            return Ok(await _context.PhieuNhaps.ToListAsync());
        }

        // POST: api/phieunhap
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] PhieuNhap phieuNhap, [FromQuery] int sanPhamId, [FromQuery] int soLuong)
        {
            // 1. Luu phieu nhap
            _context.PhieuNhaps.Add(phieuNhap);
            await _context.SaveChangesAsync();

            // 2. goi api c?a khoa de cong soluong
            var tonKho = new
            {
                SanPhamId = sanPhamId,
                SoLuong = soLuong
            };

            var json = JsonSerializer.Serialize(tonKho);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync("http://localhost:5001/api/tonkho", content);

            if (!response.IsSuccessStatusCode)
                return StatusCode(500, new { message = "Luu phieu nhap thanh cong nhung cap nhat ton kho that bai" });

            return Ok(new { message = "tao phieu nhap va cap nhat ton kho thanh cong", phieuNhap });
        }
    }
}