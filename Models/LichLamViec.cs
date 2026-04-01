namespace WebApplication1.Models
{
    public class LichLamViec
    {
        public int Id { get; set; }
        public int NhanVienId { get; set; }
        public DateTime NgayLam { get; set; }
        public string Ca { get; set; } = string.Empty; // Sáng/Chiều/Tối
    }
}