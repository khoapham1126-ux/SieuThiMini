using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WebApplication1.Migrations
{
    /// <inheritdoc />
    public partial class ThemCotConThieu : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DonViTinh",
                table: "SanPhams",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "GiaNhap",
                table: "LoHangs",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "LoaiDonVi",
                table: "LoHangs",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_LoHangs_SanPhamId",
                table: "LoHangs",
                column: "SanPhamId");

            migrationBuilder.AddForeignKey(
                name: "FK_LoHangs_SanPhams_SanPhamId",
                table: "LoHangs",
                column: "SanPhamId",
                principalTable: "SanPhams",
                principalColumn: "maSanPham",
                onDelete: ReferentialAction.NoAction);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_LoHangs_SanPhams_SanPhamId",
                table: "LoHangs");

            migrationBuilder.DropIndex(
                name: "IX_LoHangs_SanPhamId",
                table: "LoHangs");

            migrationBuilder.DropColumn(
                name: "DonViTinh",
                table: "SanPhams");

            migrationBuilder.DropColumn(
                name: "GiaNhap",
                table: "LoHangs");

            migrationBuilder.DropColumn(
                name: "LoaiDonVi",
                table: "LoHangs");
        }
    }
}
