namespace WebApplication1.Models
{
    public class HoaDon
    {
        public int Id { get; set; }
        public DateTime NgayXuat { get; set; }
        public decimal TongTien { get; set; }
        public string PhuongThucThanhToan { get; set; } = string.Empty;
        public int DonHangId { get; set; }
    }
}