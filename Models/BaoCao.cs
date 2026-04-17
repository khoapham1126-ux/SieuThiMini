namespace WebApplication1.Models
{
    public class BaoCao
    {
        public int Id { get; set; }
        public string LoaiBaoCao { get; set; } = string.Empty;
        public DateTime NgayTao { get; set; }
        public string NoiDung { get; set; } = string.Empty;
        public int NhanVienId { get; set; }
    }
}