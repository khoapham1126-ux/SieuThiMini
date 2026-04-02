namespace WebApplication1.Models
{
    public class DonHang
    {
        public int Id { get; set; }
        public DateTime NgayTao { get; set; }
        public decimal TongTien { get; set; }
        public string TrangThai { get; set; } = string.Empty;
        public int KhachHangId { get; set; }
        public int NhanVienId { get; set; }
    }
}