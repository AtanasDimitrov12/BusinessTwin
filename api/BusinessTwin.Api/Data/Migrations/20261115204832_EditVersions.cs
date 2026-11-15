using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BusinessTwin.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class EditVersions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "version",
                table: "scenarios",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "version",
                table: "businesses",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "version",
                table: "baselines",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "version",
                table: "scenarios");

            migrationBuilder.DropColumn(
                name: "version",
                table: "businesses");

            migrationBuilder.DropColumn(
                name: "version",
                table: "baselines");
        }
    }
}
