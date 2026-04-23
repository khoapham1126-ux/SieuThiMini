using Microsoft.EntityFrameworkCore;
using WebApplication1.Models;

namespace WebApplication1.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options) { }
        public DbSet<Sanpham> SanPhams { get; set; }
        public DbSet<Danhmuc> DanhMucs { get; set; }
        public DbSet<DonHang> DonHangs { get; set; }
        public DbSet<ChiTietDonHang> ChiTietDonHangs { get; set; }
        public DbSet<HoaDon> HoaDons { get; set; }
        public DbSet<KhuyenMai> KhuyenMais { get; set; }
        public DbSet<KhachHang> KhachHangs { get; set; }
        public DbSet<TonKho> TonKhos { get; set; }
        public DbSet<LoHang> LoHangs { get; set; }
        public DbSet<NhaCungCap> NhaCungCaps { get; set; }
        public DbSet<NhanVien> NhanViens { get; set; }
        public DbSet<PhieuNhap> PhieuNhaps { get; set; }
        public DbSet<ChiTietPhieuNhap> ChiTietPhieuNhaps { get; set; }
        public DbSet<CanhBao> CanhBaos { get; set; }
        public DbSet<LichLamViec> LichLamViecs { get; set; }
        public DbSet<BaoCao> BaoCaos { get; set; }
        //public DbSet<KhuyenMai> KhuyenMais { get; set; }

    }
}