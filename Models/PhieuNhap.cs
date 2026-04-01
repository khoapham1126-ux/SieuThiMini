namespace WebApplication1.Models
{
    public class PhieuNhap
    {
        public int Id { get; set; }
        public DateTime NgayNhap { get; set; }
        public decimal TongTien { get; set; }
        public int NhaCungCapId { get; set; }
        public int NhanVienId { get; set; }
    }
}