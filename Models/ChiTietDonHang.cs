namespace WebApplication1.Models
{
    public class ChiTietDonHang
    {
        public int Id { get; set; }
        public int SoLuong { get; set; }
        public decimal DonGia { get; set; }
        public int DonHangId { get; set; }
        public int SanPhamId { get; set; }
    }
}