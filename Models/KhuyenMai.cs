namespace WebApplication1.Models
{
    public class KhuyenMai
    {
        public int Id { get; set; }
        public string Ten { get; set; } = string.Empty;
        public decimal PhanTramGiam { get; set; }
        public DateTime NgayBatDau { get; set; }
        public DateTime NgayKetThuc { get; set; }
        public string DieuKienApDung { get; set; } = string.Empty;
    }
}