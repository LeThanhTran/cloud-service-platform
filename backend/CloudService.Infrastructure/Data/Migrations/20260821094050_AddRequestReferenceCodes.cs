using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CloudService.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddRequestReferenceCodes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ReferenceCode",
                table: "OrderRequests",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReferenceCode",
                table: "ContactRequests",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReferenceCode",
                table: "AffiliateApplications",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_OrderRequests_ReferenceCode",
                table: "OrderRequests",
                column: "ReferenceCode",
                unique: true,
                filter: "[ReferenceCode] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_ContactRequests_ReferenceCode",
                table: "ContactRequests",
                column: "ReferenceCode",
                unique: true,
                filter: "[ReferenceCode] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_AffiliateApplications_ReferenceCode",
                table: "AffiliateApplications",
                column: "ReferenceCode",
                unique: true,
                filter: "[ReferenceCode] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_OrderRequests_ReferenceCode",
                table: "OrderRequests");

            migrationBuilder.DropIndex(
                name: "IX_ContactRequests_ReferenceCode",
                table: "ContactRequests");

            migrationBuilder.DropIndex(
                name: "IX_AffiliateApplications_ReferenceCode",
                table: "AffiliateApplications");

            migrationBuilder.DropColumn(
                name: "ReferenceCode",
                table: "OrderRequests");

            migrationBuilder.DropColumn(
                name: "ReferenceCode",
                table: "ContactRequests");

            migrationBuilder.DropColumn(
                name: "ReferenceCode",
                table: "AffiliateApplications");
        }
    }
}
