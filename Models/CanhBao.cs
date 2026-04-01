namespace WebApplication1.Models
{
    public class CanhBao
    {
        public int Id { get; set; }
        public string LoaiCanhBao { get; set; } = string.Empty;
        public string NoiDung { get; set; } = string.Empty;
        public DateTime ThoiGian { get; set; }
        public bool DaXuLy { get; set; }
        public int SanPhamId { get; set; }
    }
}