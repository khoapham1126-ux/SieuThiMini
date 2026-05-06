namespace WebApplication1.Models
{
    public class KhuyenMai
    {
        public int Id { get; set; }
        public string Ten { get; set; } = string.Empty;
        public decimal PhanTramGiam { get; set; }
        public string GhiChu { get; set; } = "Còn hiệu lực";
    }
}