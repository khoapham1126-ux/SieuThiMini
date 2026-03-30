using System.ComponentModel.DataAnnotations;

namespace WebApplication1.Models
{
    public class Sanpham
    {
        [Key]
        public int maSanPham { get; set; }
        public string tenSanPham { get; set; } = string.Empty;
        public string maVach { get; set; } = string.Empty;
        public int giaBan { get; set; }
        public int giaVon { get; set; }
        public int maDanhMuc { get; set; }
        public bool trangthai { get; set; }
        public int maNhaCungCap { get; set; }

    }
}
