namespace WebApplication1.Models
{
    public class ChiTietPhieuNhap
    {
        public int Id { get; set; }
        public int SoLuong { get; set; }
        public decimal DonGia { get; set; }
        public int PhieuNhapId { get; set; }
        public int SanPhamId { get; set; }
    }
}