namespace WebApplication1.Models
{
    public class KhachHang
    {
        public int Id { get; set; }
        public string HoTen { get; set; } = string.Empty;
        public string SoDienThoai { get; set; } = string.Empty;
        public decimal DiemTichLuy { get; set; }
        public DateTime NgayDangKy { get; set; }
    }
}