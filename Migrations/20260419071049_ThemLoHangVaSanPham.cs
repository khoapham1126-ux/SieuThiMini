using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WebApplication1.Migrations
{
    /// <inheritdoc />
    public partial class ThemLoHangVaSanPham : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_TonKhos_LoHangId",
                table: "TonKhos",
                column: "LoHangId");

            migrationBuilder.CreateIndex(
                name: "IX_TonKhos_SanPhamId",
                table: "TonKhos",
                column: "SanPhamId");

            migrationBuilder.CreateIndex(
                name: "IX_CanhBaos_SanPhamId",
                table: "CanhBaos",
                column: "SanPhamId");

            migrationBuilder.AddForeignKey(
                name: "FK_CanhBaos_SanPhams_SanPhamId",
                table: "CanhBaos",
                column: "SanPhamId",
                principalTable: "SanPhams",
                principalColumn: "maSanPham",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_TonKhos_LoHangs_LoHangId",
                table: "TonKhos",
                column: "LoHangId",
                principalTable: "LoHangs",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_TonKhos_SanPhams_SanPhamId",
                table: "TonKhos",
                column: "SanPhamId",
                principalTable: "SanPhams",
                principalColumn: "maSanPham",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CanhBaos_SanPhams_SanPhamId",
                table: "CanhBaos");

            migrationBuilder.DropForeignKey(
                name: "FK_TonKhos_LoHangs_LoHangId",
                table: "TonKhos");

            migrationBuilder.DropForeignKey(
                name: "FK_TonKhos_SanPhams_SanPhamId",
                table: "TonKhos");

            migrationBuilder.DropIndex(
                name: "IX_TonKhos_LoHangId",
                table: "TonKhos");

            migrationBuilder.DropIndex(
                name: "IX_TonKhos_SanPhamId",
                table: "TonKhos");

            migrationBuilder.DropIndex(
                name: "IX_CanhBaos_SanPhamId",
                table: "CanhBaos");
        }
    }
}
