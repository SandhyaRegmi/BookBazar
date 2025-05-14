using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BookBazar.Model;

public class Bookmark
{
    [Key]
    public Guid BookmarkId { get; set; }

    [Required]
    public Guid UserId { get; set; }

    [Required]
    public Guid BookId { get; set; }

    [ForeignKey("UserId")]
    public User? User { get; set; }

    [ForeignKey("BookId")]
    public Books? Book { get; set; }
}
