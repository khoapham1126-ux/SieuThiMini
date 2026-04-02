namespace WebApplication1.Models
{
    public class LoHang
    {
        public int Id { get; set; }
        public DateTime NgayNhap { get; set; }
        public DateTime HanSuDung { get; set; }
        public int SoLuongNhap { get; set; }
        public int SanPhamId { get; set; }
    }
}