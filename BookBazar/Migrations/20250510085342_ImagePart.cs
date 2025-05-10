using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BookBazar.Migrations
{
    /// <inheritdoc />
    public partial class ImagePart : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ImageContentType",
                table: "Books",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<byte[]>(
                name: "ImageData",
                table: "Books",
                type: "bytea",
                nullable: false,
                defaultValue: new byte[0]);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImageContentType",
                table: "Books");

            migrationBuilder.DropColumn(
                name: "ImageData",
                table: "Books");
        }
    }
}
